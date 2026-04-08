/*!
 * Voice Inspection (single-file bundle)
 * - Core + lazy audio prefetch + SPA adapter for jQuery/AJAX
 * - Exposes `window.VoiceSPA.mount(root[, opts])` and `window.VoiceSPA.unmount()`
 * - root: DOM node or selector that contains the form with .js-voice-inspection
 * - Requires a container with data-voice-manifest-url or data-voice-manifest (inline JSON)
 * - Optional: data-stt-endpoint (defaults to openai_transcribe.php)
 */
; (function (global) {
    'use strict';

    /* =============================
     * Small utilities (no globals)
     * ============================= */
    var Helper = {
        init: function (ctx) {
            // ctx: { loaderEl, vadCanvas }
            this.loader = (ctx && ctx.loaderEl) || null;
            this.vadCanvas = (ctx && ctx.vadCanvas) || null;
            if (this.vadCanvas) {
                var self = this;
                var size = function () {
                    var r = self.vadCanvas.getBoundingClientRect();
                    self.vadCanvas.width = Math.max(280, Math.floor(r.width));
                    self.vadCanvas.height = Math.floor(r.height || 52);
                };
                size();
                addEventListener('resize', size, { passive: true });
            }
        },
        $: function (sel, root) { return (root || document).querySelector(sel); },
        escape: function (s) { return String(s || '').replace(/[&<>"']/g, function (m) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]; }); },
        tick: function () { return new Promise(function (r) { requestAnimationFrame(function () { requestAnimationFrame(r); }); }); },
        showLoader: async function () { if (!this.loader) return; this.loader.classList.add('show'); await this.tick(); },
        hideLoader: function () { if (this.loader) this.loader.classList.remove('show'); }
    };

    /* =============================
     * Platform detection
     * ============================= */
    var UA = navigator.userAgent;
    var isIOS = /iPad|iPhone|iPod/.test(UA);
    var isSafari = /^((?!chrome|android).)*safari/i.test(UA);

    /* =============================
     * Classifier (YES/NO/NA/NEXT)
     * ============================= */
    var YES_WORDS = ['yes', 'yep', 'yeah', 'yup', 'sure', 'affirmative', 'correct', 'pass'];
    var STOP_WORDS = ['stop', 'stop now', 'stop it', 'abort', 'cancel'];
    var NO_WORDS = ['no', 'nope', 'negative', 'incorrect', 'fail'];
    var NA_WORDS = ['n a', 'n/a', 'n slash a', 'unknown', 'unsure', 'not sure', "can't tell", 'cannot tell', "doesn't apply", 'does not apply', 'irrelevant', 'not relevant', 'not applicable', "i don't know", 'i dont know', 'idk', 'dunno'];
    var NEXT_WORDS = ['next', 'skip', 'skip question', 'next question'];

    var MAP = (function () {
        var m = {};
        YES_WORDS.forEach(function (w) { m[w] = 'YES'; });
        NO_WORDS.forEach(function (w) { m[w] = 'NO'; });
        NA_WORDS.forEach(function (w) { m[w] = 'NA'; });
        NEXT_WORDS.forEach(function (w) { m[w] = 'NEXT'; });
        return m;
    })();

    function classifyTranscript(raw) {
        var text = String(raw || '').toLowerCase()
            .replace(/[\u2019’]/g, "'")
            .replace(/[^\w\s/']/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        if (!text) return null;
        if (/\b(?:stop(?:\s+(?:now|it))?|abort|cancel)\b/.test(text)) return 'STOP';
        if (/\b(?:n\s*\/\s*a|n\s+slash\s+a|n\s*a)\b/.test(text)) return 'NA';
        if (/\b(?:does(?:\s*not|n['’]?t)\s*apply|not\s+app(?:lic(?:able)?|ly)?)\b/.test(text)) return 'NA';
        if (/\b(?:irrelevant|not\s+relevant)\b/.test(text)) return 'NA';
        if (/\b(?:unknown|unsure|not\s+sure|(?:can['’]?t|cannot)\s+tell|i\s+don['’]?t\s+know|idk|dunno)\b/.test(text)) return 'NA';
        if (/\b(?:next|skip)(?:\s+question)?\b/.test(text)) return 'NEXT';

        if (MAP[text]) return MAP[text];

        var tokens = text.split(' ');
        var last = null;
        for (var i = 0; i < tokens.length; i++) {
            var t = tokens[i];
            if (MAP[t]) last = MAP[t];
            if (t === 'not' && (tokens[i + 1] === 'applicable' || tokens[i + 1] === 'relevant')) last = 'NA';
            if (t === "doesn't" || t === 'doesnt' || t === 'does') {
                var nxt = tokens.slice(i, i + 3).join(' ');
                if (/does(?:\s*not|n['’]?t)?\s*apply/.test(nxt)) last = 'NA';
            }
        }
        return last;
    }

    /* =============================
     * Lazy audio prefetch policy
     * ============================= */
    var AUDIO_PREFETCH = {
        mode: 'category',   // 'category' | 'all'
        lookahead: 1,       // prefetch N next questions
        streaming: true     // allow playback to start before full download
    };

    /* =============================
     * Ask (MP3 player) with lazy/streaming cache
     * ============================= */
    function AskMp3(opts) {
        this.opts = Object.assign({ useTTSFallback: false, streaming: AUDIO_PREFETCH.streaming }, opts || {});
        this.audio = new Audio();
        this.audio.preload = this.opts.streaming ? 'metadata' : 'auto';
        this.cache = new Map(); // url -> objectURL | true
    }
    AskMp3.prototype.stop = function () {
        try { this.audio.pause(); } catch { }
        try { this.audio.currentTime = 0; } catch { }
        try {
            if (typeof this.audio.onended === 'function') {
                var cb = this.audio.onended;
                this.audio.onended = null;
                cb();
            }
        } catch { }
    };
    AskMp3.prototype.prefetch = async function (urls) {
        var uniq = Array.from(new Set((urls || []).filter(Boolean)));
        await Promise.all(uniq.map(this.ensureLoaded.bind(this)));
    };
    AskMp3.prototype.ensureLoaded = async function (url) {
        if (!url || this.cache.has(url)) return;
        if (this.opts.streaming) {
            try { await fetch(url, { method: 'GET', headers: { 'Range': 'bytes=0-1024' }, cache: 'force-cache' }); } catch { }
            this.cache.set(url, true);
            return;
        }
        var resp = await fetch(url, { cache: 'force-cache' });
        var blob = await resp.blob();
        var obj = URL.createObjectURL(blob);
        this.cache.set(url, obj);
    };
    AskMp3.prototype.sayUrl = async function (url) {
        if (!url) return;
        await this.ensureLoaded(url);
        var src = this.opts.streaming ? url : (this.cache.get(url) || url);
        this.audio.src = src;
        try { await this.audio.play(); } catch { }
        await new Promise(function (r) {
            this.audio.onended = r;
            this.audio.onerror = r;
        }.bind(this));
    };
    AskMp3.prototype.sayText = async function (text) {
        if (this.opts.useTTSFallback && 'speechSynthesis' in window) {
            var u = new SpeechSynthesisUtterance(text);
            return new Promise(function (r) { u.onend = r; u.onerror = r; speechSynthesis.speak(u); });
        }
    };
    AskMp3.prototype.ask = function (node) {
        if (node && node.mp3) return this.sayUrl(node.mp3);
        return this.sayText(node && node.text || '');
    };

    /* =============================
     * Recorder (VAD + WAV 16k mono)
     * ============================= */
    function Recorder(opts) {
        this.canvas = (opts && opts.canvas) || null;
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.ac = null; this.mic = null;
        this.detectVAD = !opts || opts.detectVAD !== false;
        this.visualVAD = !opts || opts.visualVAD !== false;
        this._abort = false;
    }
    Recorder.prototype.abort = function () { this._abort = true; };
    Recorder.prototype.release = async function () {
        this._abort = true;

        try {
            if (this.mic) this.mic.getTracks().forEach(t => { try { t.stop(); } catch (e) { } });
        } catch (e) { }
        this.mic = null;

        try {
            if (this.ac && typeof this.ac.suspend === 'function' && this.ac.state === 'running') {
                await this.ac.suspend();
            }
        } catch (e) { }
    };
    Recorder.prototype.setVAD = function (cfg) {
        cfg = cfg || {};
        if (typeof cfg.detect === 'boolean') this.detectVAD = cfg.detect;
        if (typeof cfg.visual === 'boolean') {
            this.visualVAD = cfg.visual;
            if (!cfg.visual) { this.canvas = null; this.ctx = null; }
        }
    };
    Recorder.prototype.ensureMic = async function () {
        if (this.mic && this.mic.active) return;
        var c1 = { audio: { echoCancellation: { ideal: true }, noiseSuppression: { ideal: true } } };
        var c2 = { audio: { echoCancellation: true } };
        var c3 = { audio: true };
        var lastErr;
        var i, confs = [c1, c2, c3];
        for (i = 0; i < confs.length; i++) {
            try { this.mic = await navigator.mediaDevices.getUserMedia(confs[i]); break; }
            catch (e) { lastErr = e; }
        }
        if (!this.mic) throw lastErr || new Error('Microphone not available');
        this.ac = this.ac || new (window.AudioContext || window.webkitAudioContext)();
        if (this.ac.state === 'suspended') { try { await this.ac.resume(); } catch { } }
    };
    Recorder.prototype.pickMime = function () {
        if (!window.MediaRecorder) return '';
        if (isIOS) return ''; // iOS → PCM fallback
        var prefs = ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'];
        for (var i = 0; i < prefs.length; i++) {
            try { if (MediaRecorder.isTypeSupported(prefs[i])) return prefs[i]; } catch { }
        }
        return '';
    };
    Recorder.prototype.recordOnce = async function () {
        await this.ensureMic();

        var ctx = this.ac;
        var src = ctx.createMediaStreamSource(this.mic);
        var analyser = ctx.createAnalyser(); analyser.fftSize = 512; src.connect(analyser);

        var PRE_ROLL_MS = 200, START_FACTOR = 2.2, STOP_FACTOR = 1.5, MIN_SPEECH_MS = 250, SILENCE_TAIL = 300, MAX_AFTER_START_MS = 1200, MAX_MS = 8000;

        var mime = this.pickMime(), rec = null, parts = [], waitStop = Promise.resolve();
        if (window.MediaRecorder && mime) {
            rec = new MediaRecorder(this.mic, { mimeType: mime });
            rec.ondataavailable = function (e) { if (e.data && e.data.size) parts.push(e.data); };
            waitStop = new Promise(function (res) { rec.onstop = function () { setTimeout(res, 0); }; });
            try { rec.start(250); } catch { }
        } else {
            // ScriptProcessor fallback (iOS)
            var proc = ctx.createScriptProcessor(4096, 1, 1);
            var silent = ctx.createGain(); silent.gain.value = 0;
            proc.onaudioprocess = function (e) { parts.push(new Float32Array(e.inputBuffer.getChannelData(0))); };
            src.connect(proc); proc.connect(silent); silent.connect(ctx.destination);
            rec = { _pcm: true, stop: function () { try { proc.disconnect(); } catch { } try { silent.disconnect(); } catch { } } };
        }

        // VAD loop
        var energyEMA = 0, noiseFloor = 2, thrStart = 6, thrStop = 4;
        var started = false, startedAt = 0, speechMs = 0, silenceMs = 0, totalMs = 0;
        var voicedFrames = 0, rafId = 0, last = performance.now();

        await new Promise(function (resolve) {
            (function loop() {
                var now = performance.now(), dt = now - last; last = now; totalMs += dt;
                if (this._abort) {
                    this._abort = false;
                    stop();
                    return;
                }
                var data = new Uint8Array(analyser.fftSize); analyser.getByteTimeDomainData(data);
                var sum = 0; for (var i = 0; i < data.length; i++) { var v = data[i] - 128; sum += v * v; }
                var rms = Math.sqrt(sum / data.length); energyEMA = 0.6 * energyEMA + 0.4 * rms;
                if (totalMs < PRE_ROLL_MS) { noiseFloor = Math.max(2, Math.max(noiseFloor, energyEMA)); } else { noiseFloor = 0.995 * noiseFloor + 0.005 * energyEMA; }
                thrStart = Math.max(5, noiseFloor * START_FACTOR); thrStop = Math.max(4, noiseFloor * STOP_FACTOR);
                var speaking = energyEMA > (started ? thrStop : thrStart);

                if (this.visualVAD && this.ctx && this.canvas) {
                    var c = this.canvas, g = this.ctx, w = c.width, h = c.height;
                    var img = g.getImageData(1, 0, w - 1, h); g.putImageData(img, 0, 0);
                    g.fillStyle = '#0b1220'; g.fillRect(w - 1, 0, 1, h);
                    var norm = Math.min(1, energyEMA / 50), thrN = Math.min(1, thrStart / 50);
                    var y = h - Math.floor(norm * h), thrY = h - Math.floor(thrN * h);
                    g.fillStyle = (norm > thrN) ? '#27c93f' : '#2b6ef5'; g.fillRect(w - 2, y, 2, h - y);
                    g.fillStyle = '#ffcf33'; g.fillRect(w - 2, thrY, 2, 2);
                }

                if (!started) {
                    if (speaking) { started = true; startedAt = totalMs; voicedFrames++; }
                    if (totalMs >= 1200) { stop(); return; }
                } else {
                    if (speaking) { speechMs += dt; silenceMs = 0; voicedFrames++; } else { silenceMs += dt; }
                    var longSpeech = (totalMs - startedAt) >= MAX_AFTER_START_MS;
                    var tailOk = (silenceMs >= SILENCE_TAIL && speechMs >= MIN_SPEECH_MS);
                    if (longSpeech || tailOk || totalMs >= MAX_MS) { stop(); return; }
                }
                rafId = requestAnimationFrame(loop.bind(this));

                function stop() { cancelAnimationFrame(rafId); try { if (rec && rec.state === 'recording') { try { rec.requestData && rec.requestData(); } catch { } rec.stop(); } } catch { } resolve(); }
            }).call(this);
        }.bind(this));

        if (rec && !rec._pcm) { try { await waitStop; } catch { } }

        // WAV build 16k mono
        var blob;
        try {
            var isBlob = parts.length && (parts[0] instanceof Blob);
            if (isBlob) {
                var mimeNow = this.pickMime();
                blob = new Blob(parts, { type: mimeNow || (parts[0] && parts[0].type) || 'audio/webm' });
                if (!/^audio\/wav/.test(blob.type)) blob = await this.toWav(blob, 16000);
            } else {
                var pcm = this.concatFloat32(parts);
                var rate = (this.ac && this.ac.sampleRate) ? this.ac.sampleRate : 48000;
                var mono16k = (rate === 16000) ? pcm : this.linearResample(pcm, rate, 16000);
                blob = this.floatsToWav(mono16k, 16000);
            }
        } catch (e) {
            blob = this.floatsToWav(new Float32Array(1), 16000);
        }

        var silence = !voicedFrames || ((blob && blob.size || 0) < 800);
        return { blob: blob, meta: { started: voicedFrames > 0, voicedFrames: voicedFrames }, silence: silence };
    };
    Recorder.prototype.toWav = async function (blob, targetRate) {
        var buf = await blob.arrayBuffer().catch(function () { return new ArrayBuffer(0); });
        var ctx = this.ac || new (window.AudioContext || window.webkitAudioContext)();
        if (buf.byteLength === 0) { return this.floatsToWav(new Float32Array(1), targetRate); }
        var au = await ctx.decodeAudioData(buf).catch(function () { return null; });
        if (!au) { return this.floatsToWav(new Float32Array(1), targetRate); }
        var srcRate = au.sampleRate;
        var ch0 = au.numberOfChannels > 1 ? this.mixToMono(au) : au.getChannelData(0);
        var mono = (srcRate === targetRate) ? ch0 : this.linearResample(ch0, srcRate, targetRate);
        return this.floatsToWav(mono, targetRate);
    };
    Recorder.prototype.mixToMono = function (au) {
        var len = au.length, out = new Float32Array(len);
        for (var ch = 0; ch < au.numberOfChannels; ch++) {
            var d = au.getChannelData(ch);
            for (var i = 0; i < len; i++) out[i] += d[i] / au.numberOfChannels;
        }
        return out;
    };
    Recorder.prototype.linearResample = function (input, srcRate, dstRate) {
        var ratio = srcRate / dstRate, dstLen = Math.floor(input.length / ratio), out = new Float32Array(dstLen);
        for (var i = 0; i < dstLen; i++) {
            var idx = i * ratio, i0 = Math.floor(idx), i1 = Math.min(input.length - 1, i0 + 1), t = idx - i0;
            out[i] = input[i0] * (1 - t) + input[i1] * t;
        }
        return out;
    };
    Recorder.prototype.floatsToWav = function (float32, rate) {
        var len = float32.length, ab = new ArrayBuffer(44 + len * 2), v = new DataView(ab), d = new Int16Array(ab, 44);
        for (var i = 0; i < len; i++) d[i] = Math.max(-1, Math.min(1, float32[i])) * 0x7fff;
        this._w(v, 0, 'RIFF'); v.setUint32(4, 36 + len * 2, true);
        this._w(v, 8, 'WAVE'); this._w(v, 12, 'fmt ');
        v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
        v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true);
        v.setUint16(32, 2, true); v.setUint16(34, 16, true);
        this._w(v, 36, 'data'); v.setUint32(40, len * 2, true);
        return new Blob([ab], { type: 'audio/wav' });
    };
    Recorder.prototype._w = function (dv, off, str) { for (var i = 0; i < str.length; i++) dv.setUint8(off + i, str.charCodeAt(i)); };
    Recorder.prototype.concatFloat32 = function (chunks) {
        if (!chunks || !chunks.length) return new Float32Array(0);
        var total = 0; for (var i = 0; i < chunks.length; i++) { total += chunks[i].length || 0; }
        var out = new Float32Array(total), off = 0;
        for (i = 0; i < chunks.length; i++) { out.set(chunks[i], off); off += chunks[i].length || 0; }
        return out;
    };

    /* =============================
     * Transport (STT backend)
     * ============================= */
    function Transport(opts) {
        this.endpoint = (opts && opts.endpoint) ? opts.endpoint : 'openai_transcribe.php';
    }
    Transport.prototype.transcribe = async function (blob) {
        var b64 = await new Promise(function (res) {
            var fr = new FileReader();
            fr.onload = function () { var s = String(fr.result || ''); res(s.split(',')[1] || ''); };
            fr.readAsDataURL(blob);
        });
        await Helper.showLoader();
        try {
            var out = await fetch(this.endpoint, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audio: b64 })
            }).then(function (r) { return r.json(); }).catch(function () { return { text: '', confidence: 0 }; });
            return { text: out.text || '', confidence: out.confidence || 0 };
        } finally { Helper.hideLoader(); }
    };

    /* =============================
     * UI helpers bound per host
     * ============================= */
    function makeDockUI(host) {
        var dockQuestion = host.querySelector('#dockQuestion');
        var dockSub = host.querySelector('#dockSub');
        var micDot = host.querySelector('#micDot');
        return {
            setQuestion: function (t) { if (dockQuestion) dockQuestion.textContent = t || ''; },
            setSub: function (t) { if (dockSub) dockSub.textContent = t || ''; },
            micHot: function (on) { if (micDot) micDot.classList.toggle('hot', !!on); }
        };
    }

    function renderLegend(host) {
        var el = host.querySelector('#viLegend');
        if (!el) return;

        function line(label, arrOrHtml) {
            var html = Array.isArray(arrOrHtml)
                ? arrOrHtml.map(Helper.escape).join(', ')
                : arrOrHtml;
            return '<div class="mb-2"><strong>' + Helper.escape(label) + '</strong> &rarr; ' + html + '</div>';
        }

        var YES = ['yes', 'yep', 'yeah', 'pass', 'affirmative', 'correct', 'sure', 'yup'];
        var NO = ['no', 'nope', 'fail', 'negative', 'incorrect'];
        var NA = ['n a', 'n slash a', 'n/a', 'unknown', 'unsure / not sure', "i don't know", "doesn't apply"];
        var NEXT = ['next', 'skip', 'skip question', 'next question'];
        var STOP = ['stop', 'stop now', 'stop it', 'abort', 'cancel'];

        var parts = [
            line('YES', YES),
            line('NO', NO),
            line('NA', NA),
            line('NEXT', NEXT),
            line('STOP', STOP),
            '<hr class="my-2">',
            '<div class="text-muted">Say one of the keywords above while the mic is listening.</div>'
        ];
        el.innerHTML = parts.join('');
    }

    /* =============================
     * VoiceCore (lifecycle)
     * ============================= */
    function VoiceCore(options) {
        this.opts = options || {};
        this.host = options.host;
        this.ask = options.ask;
        this.rec = options.recorder;
        this.tx = options.transport;
        this.cb = options.callbacks || {};
        this.features = Object.assign({
            logging: true,
            vad: { detect: true, visual: true },
            ui: { showInstructions: true, showQuestion: false, showResult: true, showLog: true, showVad: false }
        }, options.features || {});

        this.running = false; this.manifest = null; this.categories = []; this.catIdx = 0; this.qIdx = 0; this.phase = 'idle';
        this.stats = { YES: 0, NO: 0, NA: 0, NEXT: 0, SKIP: 0 };

        // Bind DOM relative to host
        this.dom = {
            q: Helper.$('#q', this.host),
            result: Helper.$('#result', this.host),
            log: Helper.$('#log', this.host),
            instructions: Helper.$('#instructions', this.host)
        };
        this.dockUI = makeDockUI(this.host);
        this.fields = [];
    }

    VoiceCore.prototype.shouldConfirmCategory = function (cat) {
        if (cat && typeof cat.confirm === 'boolean') return cat.confirm;
        if (this.manifest && typeof this.manifest.confirmCategory === 'boolean') return this.manifest.confirmCategory;
        return true;
    };

    VoiceCore.prototype.applyUiVisibility = function () {
        var ui = this.features.ui || {};
        if (this.dom.instructions) this.dom.instructions.style.display = ui.showInstructions ? '' : 'none';
        if (this.dom.q) this.dom.q.style.display = ui.showQuestion ? '' : 'none';
        if (this.dom.result) this.dom.result.style.display = ui.showResult ? '' : 'none';
        if (this.dom.log) this.dom.log.style.display = (this.features.logging && ui.showLog) ? '' : 'none';
        var vadCfg = this.features.vad || {};
        this.rec.setVAD({ detect: vadCfg.detect, visual: vadCfg.visual });
    };

    VoiceCore.prototype.init = async function () {
        if (this.opts.manifest) { this.manifest = this.opts.manifest; }
        else if (this.opts.manifestUrl) {
            var r = await fetch(this.opts.manifestUrl, { cache: 'no-store' });
            this.manifest = r.ok ? await r.json() : null;
        }
        else if (global.VOICE_MANIFEST) { this.manifest = global.VOICE_MANIFEST; }

        if (!this.manifest) throw new Error('Manifest not provided');

        this.categories = normalizeManifest(this.manifest);

        this.fields = normalizeFields(this.manifest);

        var fieldMp3 = (this.fields || []).map(function (f) { return f.promptMp3; }).filter(Boolean);
        if (fieldMp3.length) { try { await this.ask.prefetch(fieldMp3); } catch { } }

        var fieldRep = (this.fields || []).map(f => f.repeatMp3).filter(Boolean);
        if (fieldRep.length) { try { await this.ask.prefetch(fieldRep); } catch { } }

        // Lazy top-level prefetch: only repeat/finished and category prompts
        var topLevel = [];
        for (var i = 0; i < this.categories.length; i++) {
            var c = this.categories[i];
            if (c.promptMp3) topLevel.push(c.promptMp3);
        }
        if (this.manifest.start) topLevel.unshift(this.manifest.start);
        if (this.manifest.repeat) topLevel.push(this.manifest.repeat);
        if (this.manifest.repeatField) topLevel.push(this.manifest.repeatField);
        if (this.manifest.finished) topLevel.push(this.manifest.finished);
        await this.ask.prefetch(topLevel);

        // Bind Helper to this host's loader/canvas
        Helper.init({
            loaderEl: Helper.$('#loader', this.host),
            vadCanvas: Helper.$('#dockVAD', this.host)
        });

        this.applyUiVisibility();
    };

    VoiceCore.prototype.start = async function () {
        this.stats = { YES: 0, NO: 0, NA: 0, NEXT: 0, SKIP: 0 };
        var startBtn = Helper.$('#startBtn', this.host);
        var stopBtn = Helper.$('#stopBtn', this.host);
        this.running = true;
        if (stopBtn) stopBtn.disabled = false;
        if (startBtn) startBtn.disabled = true;
        this.setCategoryButtonsDisabled(true);
        if (this.dom.q) this.dom.q.classList.remove('muted');
        if (this.manifest.start) {
            this.dockUI.setSub('Starting…');
            await this.ask.sayUrl(this.manifest.start);
        }
        if (Array.isArray(this.fields) && this.fields.length) {
            this.phase = 'fill-fields';
            await this.fillFieldsLoop();
        }
        this.catIdx = 0; this.qIdx = 0; this.phase = 'choose-category';
        await this.chooseCategoryLoop();
    };

    VoiceCore.prototype.stop = async function () {
        var startBtn = Helper.$('#startBtn', this.host);
        var stopBtn = Helper.$('#stopBtn', this.host);
        this.running = false;
        try { this.ask && this.ask.stop && this.ask.stop(); } catch { }
        try { this.rec && this.rec.abort && this.rec.abort(); } catch { }
        try { this.rec && this.rec.release && await this.rec.release(); } catch { }
        if (stopBtn) stopBtn.disabled = true;
        if (startBtn) startBtn.disabled = false;
        this.setCategoryButtonsDisabled(false);
        this.dockUI.micHot(false); this.dockUI.setSub('Stopped');
        if (this.dom.q) { this.dom.q.textContent = 'Stopped.'; }
        if (this.dom.result) { this.dom.result.textContent = ''; this.dom.result.className = ''; }
    };

    VoiceCore.prototype.destroy = async function () {
        try { await this.stop(); } catch { }
        try { this.rec && this.rec.release && await this.rec.release(); } catch { }
        try { this.ask && this.ask.stop && this.ask.stop(); } catch { }
    };

    VoiceCore.prototype.currentCategory = function () { return this.categories[this.catIdx] || null; };
    VoiceCore.prototype.currentQuestion = function () { var c = this.currentCategory(); return c ? c.questions[this.qIdx] : null; };

    VoiceCore.prototype.chooseCategoryLoop = async function () {
        var startBtn = Helper.$('#startBtn', this.host);
        var stopBtn = Helper.$('#stopBtn', this.host);

        while (this.running && this.catIdx < this.categories.length) {
            var cat = this.currentCategory();

            this.dockUI.setQuestion(cat.title);
            const needConfirm = this.shouldConfirmCategory(cat);

            if (needConfirm) {
                this.dockUI.setSub('Playing category…');
                await this.ask.ask({ text: 'Category ' + cat.title + '. Proceed?', mp3: cat.promptMp3 });

                this.dockUI.setSub('Listening…');
                var res = await this.listenAndClassifyWithRetries(2);
                var normalized = res.normalized;

                if (normalized === 'STOP') { await this.stop(); return; }

                if (normalized === 'YES') {
                    // category-level lazy prefetch (first question immediately)
                    var qmp3 = (cat.questions || []).map(function (q) { return q.mp3; }).filter(Boolean);
                    if (AUDIO_PREFETCH.mode === 'category' && qmp3.length) {
                        await this.ask.prefetch([qmp3[0]]);
                        this.ask.prefetch(qmp3.slice(1)).catch(function () { });
                    }

                    this.cb.onCategoryStart && this.cb.onCategoryStart({ categoryId: cat.id, title: cat.title });
                    this.phase = 'in-category';
                    this.qIdx = 0;
                    await this.categoryQuestionsLoop(cat);
                    this.cb.onCategoryEnd && this.cb.onCategoryEnd({ categoryId: cat.id, title: cat.title });
                } else {
                    this.catIdx++;
                    continue;
                }
                this.catIdx++; this.phase = 'choose-category';
            } else {
                var qmp3 = (cat.questions || []).map(q => q.mp3).filter(Boolean);
                if (AUDIO_PREFETCH.mode === 'category' && qmp3.length) {
                    await this.ask.prefetch([qmp3[0]]);
                    this.ask.prefetch(qmp3.slice(1)).catch(() => { });
                }
                this.cb.onCategoryStart && this.cb.onCategoryStart({ categoryId: cat.id, title: cat.title });
                this.phase = 'in-category';
                this.qIdx = 0;
                await this.categoryQuestionsLoop(cat);
                this.cb.onCategoryEnd && this.cb.onCategoryEnd({ categoryId: cat.id, title: cat.title });
                this.catIdx++; this.phase = 'choose-category';
                continue;
            }
        }

        this.running = false;
        if (stopBtn) stopBtn.disabled = true;
        if (startBtn) startBtn.disabled = false;
        this.setCategoryButtonsDisabled(false);
        this.dockUI.micHot(false);
        this.dockUI.setQuestion('Finished ✅');
        this.dockUI.setSub('');

        if (this.dom.q) { this.dom.q.textContent = 'Finished ✅'; }
        var summary = 'Summary — YES: ' + this.stats.YES + ' • NO: ' + this.stats.NO + ' • NA: ' + this.stats.NA + ' • NEXT: ' + this.stats.NEXT + ' • Skipped: ' + this.stats.SKIP;
        if (this.dom.result) { this.dom.result.className = ''; this.dom.result.textContent = summary; }
        if (this.manifest.finished) await this.ask.sayUrl(this.manifest.finished);
        this.cb.onFinish && this.cb.onFinish({ stats: Object.assign({}, this.stats) });
    };

    VoiceCore.prototype.categoryQuestionsLoop = async function (cat) {
        while (this.running && this.qIdx < cat.questions.length) {
            var q = this.currentQuestion();

            // look-ahead
            var nextQ = cat.questions[this.qIdx + 1];
            if (AUDIO_PREFETCH.lookahead > 0 && nextQ && nextQ.mp3) {
                this.ask.prefetch([nextQ.mp3]).catch(function () { });
            }

            this.dockUI.setQuestion(q.text);
            this.dockUI.setSub('Playing question…');
            this.cb.onQuestion && this.cb.onQuestion({ categoryId: cat.id, questionId: q.id, text: q.text });
            await this.ask.ask(q);

            this.dockUI.setSub('Listening…');
            var out = await this.listenAndClassifyWithRetries(3);
            var normalized = out.normalized, raw = out.raw, confidence = out.confidence;

            if (normalized === 'STOP') { await this.stop(); return; }

            if (!normalized) {
                if (this.dom.result) { this.dom.result.textContent = '(no voice)'; }
                this.addLog(q.text, '—', cat);
                this.stats.SKIP++; this.qIdx++; continue;
            }

            this.dockUI.setSub('Captured: ' + normalized);
            if (this.dom.result) { this.dom.result.textContent = 'Answer: ' + normalized; this.dom.result.className = 'ans-' + normalized; }
            this.addLog(q.text, normalized, cat);
            this.cb.onAnswer && this.cb.onAnswer({ categoryId: cat.id, questionId: q.id, questionText: q.text, normalized: normalized, raw: raw, confidence: confidence, timestamp: Date.now() });

            if (normalized === 'NEXT') { this.stats.NEXT++; }
            else if (this.stats[normalized] != null) { this.stats[normalized]++; }
            this.qIdx++;
        }
    };

    VoiceCore.prototype._resolveFieldEl = function (f) {
        if (f.selector) return document.querySelector(f.selector);
        if (f.name) return document.querySelector('[name="' + f.name + '"]');
        return null;
    };

    VoiceCore.prototype.fillFieldsLoop = async function () {
        for (var i = 0; this.running && i < this.fields.length; i++) {
            var f = this.fields[i];
            var el = this._resolveFieldEl(f);
            if (!el) { console.warn('[voiceInspection] field not found:', f); continue; }

            var cur = (el.value != null ? String(el.value).trim() : '');
            if (f.when !== 'always' && cur.length > 0) continue;

            try { el.focus(); } catch { }
            try {
                var headerH = (window.surveyHelper && typeof surveyHelper.getHeaderOffset === 'function')
                    ? surveyHelper.getHeaderOffset() : 120;
                var r = el.getBoundingClientRect();
                var top = window.scrollY + r.top - Math.max(headerH, 0) - 6;
                window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
            } catch { }

            this.dockUI.setQuestion(f.label);
            this.dockUI.setSub('Say the ' + f.label + '…');
            await this.ask.ask({ text: f.label, mp3: f.promptMp3 });

            this.dockUI.setSub('Listening…');
            var out = await this.listenFreeformWithRetries(3, f.repeatMp3 || this.manifest.repeatField || this.manifest.repeat);

            if (out.cmd === 'STOP') { await this.stop(); return; }
            if (out.cmd === 'NEXT') { continue; }
            if (out.cmd === 'CLEAR') {
                el.value = '';
                try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch { }
                try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch { }
                continue;
            }

            var text = (out.text || out.raw || '').trim();
            if (!text) {
                this.addLog('[Field] ' + f.label, '—', null);
                continue;
            }

            el.value = text;
            try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch { }
            try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch { }

            this.dockUI.setSub('Captured');
            if (this.dom.result) { this.dom.result.textContent = f.label + ': ' + text; this.dom.result.className = ''; }
            this.addLog('[Field] ' + f.label, text, null);
            try { await new Promise(function (r) { setTimeout(r, 120); }); } catch { }
        }
    };

    VoiceCore.prototype.listenAndClassifyWithRetries = async function (maxAttempts) {
        maxAttempts = maxAttempts || 2;
        for (var attempt = 0; attempt < maxAttempts; attempt++) {
            this.dockUI.micHot(true);
            var rec = await this.rec.recordOnce();
            this.dockUI.micHot(false);

            if (rec.silence) {
                if (this.manifest.repeat) {
                    this.dockUI.setSub('Playing repeat…');
                    await this.ask.sayUrl(this.manifest.repeat);
                    this.dockUI.setSub('Listening…');
                }
                continue;
            }

            this.dockUI.setSub('Transcribing…');
            var tr = await this.tx.transcribe(rec.blob);
            var combined = (tr.text || tr.raw || '');
            var norm = classifyTranscript(combined);
            if (norm) {
                return { normalized: norm, raw: combined, confidence: tr.confidence };
            }

            if ((tr.confidence || 0) < 0.75 && this.manifest.repeat) {
                this.dockUI.setSub('Playing repeat…');
                await this.ask.sayUrl(this.manifest.repeat);
                this.dockUI.setSub('Listening…');
            }
        }
        return { normalized: null, raw: '', confidence: 0 };
    };

    VoiceCore.prototype.listenFreeformWithRetries = async function (maxAttempts, repeatUrl) {
        maxAttempts = maxAttempts || 2;

        function detectCmd(text) {
            var t = String(text || '').toLowerCase().replace(/[\u2019’]/g, "'").trim();
            if (/\b(?:stop|abort|cancel|stop it|stop now)\b/.test(t)) return 'STOP';
            if (/\b(?:next|skip|skip field|next field)\b/.test(t)) return 'NEXT';
            if (/\b(?:clear|erase|delete)\b/.test(t)) return 'CLEAR';
            return null;
        }

        for (var attempt = 0; attempt < maxAttempts; attempt++) {
            this.dockUI.micHot(true);
            var rec = await this.rec.recordOnce();
            this.dockUI.micHot(false);

            if (rec.silence) {
                var rep = repeatUrl || this.manifest.repeat;
                if (rep) {
                    this.dockUI.setSub('Playing repeat…');
                    await this.ask.sayUrl(rep);
                    this.dockUI.setSub('Listening…');
                }
                continue;
            }

            this.dockUI.setSub('Transcribing…');
            var tr = await this.tx.transcribe(rec.blob); // { text, confidence }
            var combined = (tr.text || tr.raw || '');
            var cmd = detectCmd(combined);
            if (cmd) return { cmd: cmd, text: '', confidence: tr.confidence || 0 };

            var text = combined.trim();
            if (text) return { cmd: null, text: text, raw: combined, confidence: tr.confidence || 0 };

            var rep2 = repeatUrl || this.manifest.repeat;
            if ((tr.confidence || 0) < 0.75 && rep2) {
                this.dockUI.setSub('Playing repeat…');
                await this.ask.sayUrl(rep2);
                this.dockUI.setSub('Listening…');
            }
        }
        return { cmd: null, text: '', raw: '', confidence: 0 };
    };

    VoiceCore.prototype.addLog = function (q, a, cat) {
        if (!this.features || !this.features.logging) return;
        var label = cat ? '[' + Helper.escape(cat.title) + '] ' : '';
        var li = document.createElement('li');
        li.innerHTML = label + '<b>' + Helper.escape(q) + '</b> → ' + Helper.escape(a);
        var el = Helper.$('#log', this.host); if (el) el.appendChild(li);
    };

    VoiceCore.prototype.startForCategory = async function (categoryId) {
        var startBtn = Helper.$('#startBtn', this.host);
        var stopBtn = Helper.$('#stopBtn', this.host);

        this.stats = { YES: 0, NO: 0, NA: 0, NEXT: 0, SKIP: 0 };
        this.running = true;
        if (stopBtn) stopBtn.disabled = false;
        if (startBtn) startBtn.disabled = true;
        this.setCategoryButtonsDisabled(true);
        if (this.dom.q) this.dom.q.classList.remove('muted');

        var idx = -1;
        for (var i = 0; i < this.categories.length; i++) {
            if (String(this.categories[i].id) === String(categoryId)) { idx = i; break; }
        }
        if (idx === -1) {
            console.warn('[voiceInspection] Category id not found:', categoryId);
            await this.stop();
            return;
        }

        this.catIdx = idx;
        this.qIdx = 0;
        var cat = this.currentCategory();

        var qmp3 = (cat.questions || []).map(function (q) { return q.mp3; }).filter(Boolean);
        if (AUDIO_PREFETCH.mode === 'category' && qmp3.length) {
            await this.ask.prefetch([qmp3[0]]);
            this.ask.prefetch(qmp3.slice(1)).catch(function () { });
        }

        this.cb.onCategoryStart && this.cb.onCategoryStart({ categoryId: cat.id, title: cat.title });
        this.phase = 'in-category';

        await this.categoryQuestionsLoop(cat);

        this.cb.onCategoryEnd && this.cb.onCategoryEnd({ categoryId: cat.id, title: cat.title });

        this.running = false;
        if (stopBtn) stopBtn.disabled = true;
        if (startBtn) startBtn.disabled = false;
        this.setCategoryButtonsDisabled(false);
        this.dockUI.micHot(false);
        this.dockUI.setQuestion('Finished ✅');
        this.dockUI.setSub('');
        if (this.dom.q) this.dom.q.textContent = 'Finished ✅';
        var summary = 'Summary — YES: ' + this.stats.YES + ' • NO: ' + this.stats.NO + ' • NA: ' + this.stats.NA + ' • NEXT: ' + this.stats.NEXT + ' • Skipped: ' + this.stats.SKIP;
        if (this.dom.result) { this.dom.result.className = ''; this.dom.result.textContent = summary; }
        if (this.manifest.finished) await this.ask.sayUrl(this.manifest.finished);
        this.cb.onFinish && this.cb.onFinish({ stats: Object.assign({}, this.stats) });
    };

    VoiceCore.prototype.setCategoryButtonsDisabled = function (disabled) {
        try {
            document.querySelectorAll('.js-voice-start-cat')
                .forEach(function (btn) { btn.disabled = !!disabled; });
        } catch { }
    };

    /* =============================
     * Manifest schema normalizer
     * ============================= */
    function normalizeManifest(m) {
        if (Array.isArray(m.categories)) {
            return m.categories.map(function (c, idx) {
                return {
                    id: c.id || ('cat_' + (idx + 1)),
                    title: c.title || c.name || ('Category ' + (idx + 1)),
                    promptMp3: c.promptMp3 || c.mp3 || null,
                    confirm: (typeof c.confirm === 'boolean') ? c.confirm : undefined,
                    questions: (c.questions || []).map(function (q, i) {
                        return {
                            id: q.id || ((c.id || ('cat_' + (idx + 1))) + '_q' + (i + 1)),
                            text: q.text,
                            mp3: q.mp3 || null
                        };
                    })
                };
            });
        }
        if (Array.isArray(m.questions)) {
            return [{
                id: 'cat_1',
                title: m.title || 'Inspection',
                promptMp3: m.promptMp3 || null,
                questions: m.questions.map(function (q, i) { return { id: q.id || ('q' + (i + 1)), text: q.text, mp3: q.mp3 || null }; })
            }];
        }
        throw new Error('Manifest format not recognized');
    }
    function normalizeFields(m) {
        var arr = Array.isArray(m.fields) ? m.fields : [];
        return arr.map(function (f, i) {
            return {
                name: f.name || '',
                selector: f.selector || null,
                label: f.label || ('Field ' + (f.name || ('#' + (i + 1)))),
                promptMp3: f.promptMp3 || null,
                repeatMp3: f.repeatMp3 || null,
                when: (f.when === 'always' || f.when === 'empty') ? f.when : 'empty'
            };
        }).filter(function (f) { return f.name || f.selector; });
    }

    /* =============================
     * SPA adapter (mount/unmount)
     * ============================= */
    var VoiceSPA = (function () {
        var instance = null;
        var mountedRoot = null;

        function _findHost(root) {
            if (!root) return null;
            return root.querySelector('.js-voice-inspection') || null;
        }

        function _readConfig(host) {
            if (!host) return null;
            var raw = host.getAttribute('data-voice-manifest');
            var url = host.getAttribute('data-voice-manifest-url');
            var manifest = null, manifestUrl = null;

            if (raw) { try { manifest = JSON.parse(raw); } catch { } }
            else if (url) { manifestUrl = url; }

            if (!manifest && !manifestUrl) return null;

            var endpoint = host.getAttribute('data-stt-endpoint') || 'openai_transcribe.php';
            return { manifest, manifestUrl, endpoint };
        }

        async function mount(rootOrSelector, opts) {
            var root = (typeof rootOrSelector === 'string') ? document.querySelector(rootOrSelector) : rootOrSelector;
            if (!root) return;

            // If already mounted somewhere else — unmount first
            if (mountedRoot && mountedRoot !== root) unmount();

            var host = _findHost(root);
            if (!host) return; // not a voice form — ignore

            var cfg = _readConfig(host);
            if (!cfg) return;

            // Build per-instance dependencies
            var ask = new AskMp3({ useTTSFallback: false, streaming: AUDIO_PREFETCH.streaming });
            var rec = new Recorder({ canvas: host.querySelector('#dockVAD'), visualVAD: true, detectVAD: true });
            var tx = new Transport({ endpoint: cfg.endpoint });

            instance = new VoiceCore({
                host: host,
                manifest: cfg.manifest || undefined,
                manifestUrl: cfg.manifestUrl || undefined,
                ask: ask, recorder: rec, transport: tx,
                features: (opts && opts.features) || { logging: true, vad: { detect: true, visual: true }, ui: { showInstructions: true, showQuestion: false, showResult: true, showLog: true, showVad: false } },
                callbacks: (opts && opts.callbacks) || {}
            });

            await instance.init();
            renderLegend(host);
            mountedRoot = root;

            // Wire buttons inside this host
            var startBtn = host.querySelector('#startBtn');
            var stopBtn = host.querySelector('#stopBtn');

            if (startBtn) startBtn.addEventListener('click', onStart);
            if (stopBtn) stopBtn.addEventListener('click', onStop);

            async function onStart() {
                if (!instance) return;
                try { rec.ac && rec.ac.resume && (await rec.ac.resume()); } catch { }
                await instance.start();
            }
            async function onStop() {
                if (!instance) return;
                await instance.stop();
            }

            // Auto-unmount if DOM node is removed (SPA navigation)
            var mo = new MutationObserver(function () {
                if (!document.body.contains(root)) {
                    try { mo.disconnect(); } catch { }
                    unmount();
                }
            });
            mo.observe(document.body, { childList: true, subtree: true });
        }

        function unmount() {
            if (instance) {
                try {
                    if (typeof instance.destroy === 'function') {
                        instance.destroy();
                    } else {
                        instance.stop();
                    }
                } catch { }
            }
            instance = null;
            mountedRoot = null;
        }

        return {
            mount: mount,
            unmount: unmount,
            getInstance: function () { return instance; }
        };
    })();

    // Expose globally
    global.VoiceSPA = VoiceSPA;

})(window);


(function (global) {
    if (global.__VOICE_HELPER_LOADED__) return;


    /*!
    * voiceHelper: SPA adapter for VoiceSPA bundle + app.apiPOST transport
    * Usage:
    *   // enter page/form
    *   voiceHelper.init('/vn2/manifest.json', {
    *     container: '#fieldBody',
    *     useAppApi: true,
    *     apiPath: '/voice/transcribe', // will be appended to app.local.webApiUrl by app.apiPOST
    *     ui: 'panel'                   // panel-only (dock + loader)
    *   });
    *
    *   // leave page/form
    *   voiceHelper.destroy();
    */
    global.voiceHelper = (function () {
        var rootEl = null;     // wrapper we inject
        var mounted = false;

        function ensureBundle() {
            if (!window.VoiceSPA || typeof window.VoiceSPA.mount !== 'function') {
                console.error('[voiceHelper] VoiceSPA bundle is not loaded.');
                return false;
            }
            return true;
        }

        // Minimal panel-only markup (no instructions/log)
        function buildMarkup(manifestUrl, endpoint, uiMode) {
            var mode = uiMode || 'panel';
            var ep = endpoint || '';
            return (
                '<div class="js-voice-inspection" ' +
                'data-voice-manifest-url="' + manifestUrl + '" ' +
                'data-stt-endpoint="' + ep + '" ' +
                'data-voice-ui="' + mode + '">' +

                // Bottom Dock
                '<div id="dock" role="toolbar" aria-label="Voice controls">' +
                '<div class="dock-inner">' +
                '<div class="dock-info">' +
                '<div class="dock-title" id="dockQuestion">Press “Start inspection”</div>' +
                '<div class="dock-sub" id="dockSub">Ready</div>' +
                '</div>' +
                '<div class="dock-ctrls">' +
                '<button id="startBtn" aria-label="Start inspection">' +
                '<svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>' +
                '<span class="btn-label">Start</span>' +
                '</button>' +
                '<button id="stopBtn" aria-label="Stop inspection" disabled>' +
                '<svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 6h12v12H6z"/></svg>' +
                '<span class="btn-label">Stop</span>' +
                '</button>' +
                '<button id="helpBtn" type="button" aria-label="Open help" ' +
                'data-bs-toggle="modal" data-bs-target="#viHelpModal">' +
                '<svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
                '<title/><path d="M12,17a1,1,0,0,1-1-1v-.21a4.7,4.7,0,0,1,2.75-4.19A4,4,0,0,0,12,4h0A4,4,0,0,0,8,8,1,1,0,0,1,6,8a6,6,0,0,1,6-6h0a6.08,6.08,0,0,1,6,6,6,6,0,0,1-3.37,5.39A2.73,2.73,0,0,0,13,15.79V16A1,1,0,0,1,12,17Z" fill="#CCCCCC"/><circle cx="12" cy="20" fill="#CCCCCC" r="1"/>' +
                '</svg>' +
                '<span class="btn-label d-none d-sm-inline">Help</span>' +
                '</button>' +
                '</div>' +
                '<div class="dock-vad">' +
                '<canvas id="dockVAD" aria-label="Voice activity"></canvas>' +
                '<div class="mic-dot" id="micDot" title="Speak now indicator" aria-hidden="true"></div>' +
                '</div>' +
                '</div>' +
                '</div>' +

                // Loader
                '<div id="loader" aria-live="polite" aria-busy="true">' +
                '<div class="spinner" title="Sending to server…"></div>' +
                '</div>' +
                '<div class="modal fade" id="viHelpModal" tabindex="-1" aria-labelledby="viHelpTitle" aria-hidden="true">' +
                '<div class="modal-dialog modal-dialog-centered">' +
                '<div class="modal-content">' +
                '<div class="modal-header">' +
                '<h5 class="modal-title" id="viHelpTitle">How to answer</h5>' +
                '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>' +
                '</div>' +
                '<div class="modal-body">' +
                '<div id="viLegend" class=""></div>' +
                '</div>' +
                '<div class="modal-footer">' +
                '<button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Close</button>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>'
            );
        }

        // Convert Blob → base64 (plain, without data: prefix)
        async function blobToBase64(blob) {
            return new Promise(function (resolve) {
                var fr = new FileReader();
                fr.onload = function () {
                    var s = String(fr.result || '');
                    resolve((s.split(',')[1]) || '');
                };
                fr.readAsDataURL(blob);
            });
        }

        // Patch the mounted instance to use app.apiPOST instead of fetch
        function bindAppApiTransport(apiPath) {
            if (!window.app || typeof window.app.apiPOST !== 'function') {
                console.warn('[voiceHelper] app.apiPOST not found — staying on default fetch transport.');
                return;
            }
            var instance = window.VoiceSPA.getInstance && window.VoiceSPA.getInstance();
            if (!instance || !instance.tx) return;

            instance.tx.transcribe = async function (blob) {
                var b64 = await blobToBase64(blob);
                return new Promise(function (resolve, reject) {
                    // app.apiPOST adds base URL, auth headers and shows global loader
                    window.app.apiPOST(
                        apiPath,
                        { audio: b64 },                       // payload expected by your backend
                        function onOk(data) {
                            // app.apiPOST hands callback(data.data). Normalize both shapes:
                            var body = (data && (data.text || data.confidence != null)) ? data : (data && data.data) || {};
                            resolve({
                                text: body.text || '',
                                raw: body.raw || body.text || '',
                                confidence: body.confidence || 0
                            });
                        },
                        function onFail(err) {
                            console.error('[voiceHelper] STT apiPOST error:', err);
                            // Return empty text so the flow can show repeat prompt gracefully
                            resolve({ text: '', raw: '', confidence: 0 });
                        },
                        false,                                // cache
                        'json'                                // dataType
                    );
                });
            };
        }

        function injectCategoryStartButtons() {
            const inst = window.VoiceSPA.getInstance && window.VoiceSPA.getInstance();
            if (!inst || !Array.isArray(inst.categories) || !inst.categories.length) return;

            const allowed = new Set(inst.categories.map(c => String(c.id)));

            const selector = '.survey p.breadcrumb[id^="cat_"], .row [id^="title_"]';

            document.querySelectorAll(selector).forEach(function (el) {
                if (el.dataset.voiceButtonAdded) return;

                const rawId = el.id || '';
                const catId = rawId.replace(/^(cat_|title_)/, '');

                if (!catId || !allowed.has(catId)) return;

                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn btn-sm ms-4 align-baseline vi-dock-btn js-voice-start-cat';
                btn.innerHTML =
                    '<svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
                    '<path d="M8 5v14l11-7z"/></svg>';

                btn.addEventListener('click', async function () {
                    const inst = window.VoiceSPA.getInstance && window.VoiceSPA.getInstance();
                    if (!inst) return;

                    if (window.surveyHelper && typeof window.surveyHelper.expandCategoryByTitle === 'function') {
                        try { window.surveyHelper.expandCategoryByTitle({ categoryId: catId }); } catch (e) { }
                    }

                    if (inst.running) { try { await inst.stop(); } catch (e) { } }
                    try { inst.rec && inst.rec.ac && inst.rec.ac.resume && (await inst.rec.ac.resume()); } catch (e) { }

                    await inst.startForCategory(catId);
                });

                el.insertAdjacentElement('beforeend', btn);
                el.dataset.voiceButtonAdded = '1';
            });
        }

        return {
            /**
             * Mount the voice panel and hook transport into app.apiPOST if requested.
             * @param {string} manifestUrl - URL to manifest.json
             * @param {object} [opts]
             * @param {string} [opts.container='#fieldBody'] - where to append the panel
             * @param {boolean} [opts.useAppApi=true]        - use app.apiPOST instead of fetch
             * @param {string} [opts.apiPath='/ezdata/transcribe'] - relative API path for app.apiPOST
             * @param {string} [opts.endpoint='openai_transcribe.php'] - legacy endpoint (fetch fallback)
             * @param {string} [opts.ui='panel']             - 'panel' (panel+loader) | 'full'
             */
            init: async function (manifestUrl, opts) {
                if (!ensureBundle()) return;

                var options = opts || {};
                var containerSel = options.container || '#fieldBody';
                var useAppApi = (options.useAppApi !== false);   // default true
                var apiPath = options.apiPath || '/ezdata/transcribe';
                var endpoint = 'openai_transcribe'; //options.endpoint || 
                var uiMode = options.ui || 'panel';
                var callbacks = options.callbacks || null;

                var container = document.querySelector(containerSel);
                if (!container) {
                    console.error('[voiceHelper] container not found:', containerSel);
                    return;
                }

                // Inject wrapper with panel markup
                var wrapper = document.createElement('div');
                wrapper.id = 'voice-inspection-root';
                wrapper.className = 'voice-inspection-root';
                wrapper.innerHTML = buildMarkup(manifestUrl, endpoint, uiMode);
                container.appendChild(wrapper);
                rootEl = wrapper;

                try {
                    // Mount the bundle on the same root node
                    await window.VoiceSPA.mount(rootEl, {
                        callbacks: callbacks || undefined
                    });

                    function normalizeAutoStart(v) {
                        if (v === true) return 'whenIncomplete';
                        if (v === false || v == null) return false;
                        if (typeof v === 'string') {
                            const s = v.trim().toLowerCase();
                            if (['true', '1', 'yes', 'on'].includes(s)) return 'whenIncomplete';
                            if (s === 'withincomplete' || s === 'whenincomplete') return 'whenIncomplete';
                            if (['false', '0', 'no', 'off'].includes(s)) return false;
                        }
                        return false;
                    }

                    try {
                        const inst = window.VoiceSPA.getInstance && window.VoiceSPA.getInstance();
                        const mode = normalizeAutoStart(inst?.manifest?.autoStart);

                        if (mode === 'whenIncomplete') {
                            const statusField = window.page?.config?.table?.field_status;

                            const el = statusField ? document.querySelector(`[name="${statusField}"]`) : null;
                            const hasField = !!el;

                            let val = '';
                            let txt = '';
                            if (el) {
                                val = String(el.value ?? el.getAttribute('data-value') ?? '').trim();
                                if (el.tagName === 'SELECT') {
                                    txt = String(el.options[el.selectedIndex]?.text ?? '').trim();
                                } else {
                                    txt = String(el.getAttribute('data-text') || el.getAttribute('data-title') || '').trim();
                                }
                            }

                            const isRemoved = s => String(s || '').trim().toLowerCase() === 'removed';
                            const shouldAutoStart = !hasField || val === '' || isRemoved(val) || isRemoved(txt);

                            if (shouldAutoStart && inst && !inst.running) {
                                const ua = navigator.userActivation;
                                const hasGesture = !!(ua && (ua.isActive || ua.hasBeenActive));

                                if (hasGesture) {
                                    setTimeout(async () => {
                                        try { inst.rec?.ac?.resume && (await inst.rec.ac.resume()); } catch { }
                                        await inst.start();
                                    }, 0);
                                } else {
                                    const onceKick = async () => {
                                        document.removeEventListener('pointerdown', onceKick, true);
                                        if (!inst || inst.running) return;
                                        try { inst.rec?.ac?.resume && (await inst.rec.ac.resume()); } catch { }
                                        await inst.start();
                                    };
                                    document.addEventListener('pointerdown', onceKick, true);

                                    try {
                                        const sub = rootEl?.querySelector('.js-voice-inspection #dockSub');
                                        if (sub) sub.textContent = 'Tap Start to begin';
                                    } catch { }
                                }
                            }
                        }
                    } catch (e) {
                        console.warn('[voiceHelper] autoStart error:', e);
                    }

                    // Also merge callbacks onto the live instance (in case you want to replace later)
                    if (callbacks) {
                        var inst = window.VoiceSPA.getInstance && window.VoiceSPA.getInstance();
                        if (inst) inst.cb = Object.assign({}, inst.cb || {}, callbacks);
                    }
                    mounted = true;
                    $("#card-form").css({ "padding-bottom": "100px" });
                    if (useAppApi) bindAppApiTransport(apiPath);

                    try { injectCategoryStartButtons(); } catch (e) {
                        console.warn('[voiceHelper] injectCategoryStartButtons error:', e);
                    }

                } catch (e) {
                    console.error('[voiceHelper] mount failed:', e);
                    try { this.destroy(); } catch { }
                }
            },

            /**
             * Unmount and remove the panel wrapper.
             */
            destroy: function () {
                try {
                    if (mounted && window.VoiceSPA && typeof window.VoiceSPA.unmount === 'function') {
                        window.VoiceSPA.unmount();
                    }
                } catch (e) {
                    console.warn('[voiceHelper] unmount error:', e);
                }
                try {
                    if (rootEl && rootEl.parentNode) rootEl.parentNode.removeChild(rootEl);
                } catch { }
                rootEl = null;
                mounted = false;
                $("#card-form").css({ "padding-bottom": "unset" });
            }
        };
    })();

    global.surveyHelper = {
        norm: function (s) {
            return String(s || '')
                .toLowerCase()
                .replace(/[.:;!?,"'`]+/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        },

        getHeaderOffset: function () {
            const selectors = ['.app-header', '.header', '.navbar', '#kt_header', 'header'];
            for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el) {
                    const cs = window.getComputedStyle(el);
                    if (cs.position === 'fixed' || cs.position === 'sticky') {
                        const h = el.getBoundingClientRect().height || el.offsetHeight || 0;
                        return h + 25;
                    }
                }
            }
            return 120;
        },

        expandCategoryByTitle: function (arg) {
            let categoryId = null, title = null;
            if (typeof arg === 'object' && arg) {
                categoryId = String(arg.categoryId || arg.id || '').trim();
                title = arg.title || '';
            } else {
                title = arg;
            }

            if (categoryId) {
                const $p = $('#cat_' + categoryId);
                if ($p.length) {
                    this._openCategoryByP($p);
                    return true;
                }
                const $p_new = $('#title_' + categoryId);
                if ($p_new.length) {
                    this._openCategoryByPJHA($p_new);
                    return true;
                }
            }

            if (!title) return false;
            const want = this.norm(title);
            let hit = false;

            $('.survey p.breadcrumb').each(function () {
                const $p = $(this);
                const text = surveyHelper.norm($p.text());
                const $panel = $p.next('div');

                if (text === want || text.includes(want) || want.includes(text)) {
                    surveyHelper._openCategoryByP($p);
                    hit = true;
                    return false; // break
                }
            });

            if (!hit) console.warn('[voiceInspection] Category not found:', { categoryId, title });
            return hit;
        },

        _openCategoryByP: function ($p) {
            const $panel = $p.next('div');
            $panel.show();
            $('.survey p.breadcrumb').not($p).each(function () {
                $(this).next('div').hide();
            });

            const headerH = this.getHeaderOffset();
            requestAnimationFrame(() => {
                const top = Math.max($p.offset().top - headerH, 0);
                window.scrollTo({ top, behavior: 'smooth' });
            });
        },

        _openCategoryByPJHA: function ($p) {
            const $panel = $p.closest("div.title-line-accordion");
            $panel.click();
        },

        IDX: { YES: 0, NO: 1, NA: 2 },

        selectAnswerByQuestion: function (question, normalized) {
            if (!normalized || !this.IDX.hasOwnProperty(normalized)) return false;

            let questionId = null, questionText = null;
            if (typeof question === 'object' && question) {
                questionId = String(question.questionId || question.id || '').trim();
                questionText = question.questionText || question.text || '';
            } else {
                questionText = question;
            }

            if (questionId) {
                const $q = $('#' + questionId);
                if ($q.length) {
                    const $item = $q.closest('[id^="item_"]');
                    const $catPanel = $item.closest('div[style*="border-left"]');
                    if ($catPanel.length) $catPanel.show();

                    let $group = $item.find('.btn-group.btn-group-toggle').first();
                    if (!$group.length) {
                        $group = $q.find('.btn-group.btn-group-toggle').first();
                    }
                    if ($group.length) {
                        const idx = this.IDX[normalized];
                        const $targetLabel = $group.find('label').eq(idx);
                        const $input = $targetLabel.find('input[type="radio"]');

                        if ($input.length) {
                            $group.find('input[type="radio"]').prop('checked', false);
                            $group.find('label').removeClass('active');

                            $input.prop('checked', true).trigger('change');
                            $targetLabel.addClass('active');

                            const headerH = this.getHeaderOffset();
                            requestAnimationFrame(() => {
                                const top = Math.max($q.offset().top - headerH - 6, 0);
                                window.scrollTo({ top, behavior: 'smooth' });
                            });

                            return true;
                        }
                    }
                    console.warn('[voiceInspection] Radio group/input not found by questionId:', questionId);

                }
            }


            if (!questionText) return false;
            const want = this.norm(questionText.replace(/:$/, ''));
            let matched = false;

            $('.survey .row .col-sm-7 > label.form-label').each(function () {
                const $label = $(this);
                const txt = surveyHelper.norm($label.text().replace(/:$/, ''));

                if (txt === want || txt.includes(want) || want.includes(txt)) {
                    const $item = $label.closest('[id^="item_"]');
                    const $catPanel = $item.closest('div[style*="border-left"]');
                    if ($catPanel.length) $catPanel.show();

                    const $group = $item.find('.btn-group.btn-group-toggle').first();
                    if (!$group.length) {
                        console.warn('[voiceInspection] Radio group not found for question (by text):', questionText);
                        return false;
                    }

                    const idx = surveyHelper.IDX[normalized];
                    const $targetLabel = $group.find('label').eq(idx);
                    const $input = $targetLabel.find('input[type="radio"]');
                    if (!$input.length) {
                        console.warn('[voiceInspection] Radio not found by index (by text):', normalized, questionText);
                        return false;
                    }

                    $group.find('input[type="radio"]').prop('checked', false);
                    $group.find('label').removeClass('active');

                    $input.prop('checked', true).trigger('change');
                    $targetLabel.addClass('active');

                    const headerH = surveyHelper.getHeaderOffset();
                    const $row = $label.closest('.row');
                    requestAnimationFrame(() => {
                        const top = Math.max($row.offset().top - headerH - 6, 0);
                        window.scrollTo({ top, behavior: 'smooth' });
                    });

                    matched = true;
                    return false; // break
                }
            });

            if (!matched) {
                console.warn('[voiceInspection] Question not found:', { questionId, questionText });
            }
            return matched;
        }
    };

    global.__VOICE_HELPER_LOADED__ = true;
})(window);