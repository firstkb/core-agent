// gulpfile.js
const { src, dest, series, parallel, watch } = require('gulp');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const cleanCSS = require('gulp-clean-css');
const rename = require('gulp-rename');
const replace = require('gulp-replace');
const gulpif = require('gulp-if');
const connect = require('gulp-connect');
const del = require('del');
const fs = require('fs');
const path = require('path');

const pkg = require('./package.json');
const version = pkg.version || '1.0.0';

const argv = require('yargs').argv;
const env = argv.env || 'local';

const isProd = env !== 'local';
const isLocal = env === 'local';

function cleanDist() {
    return del(['dist/web/**/*']);
}

function copyIndex() {
    return src('src/index.html')
        .pipe(dest('dist/web/'));
}

function copyAssets() {
    return src([
        'src/assets/media/**',
        'src/assets/tinymce/**',
        'src/assets/webfonts/**'
    ],
        {
            base: 'src/assets/',
            encoding: false
        }
    )
        .pipe(dest('dist/web/assets'));
}

function copyTemplates() {
    return src(['src/templates/layout/**', 'src/templates/section/**'], { base: 'src/templates/' })
        .pipe(dest('dist/web/templates'));
}

function copyClient() {
    return src('src/client/**', { base: 'src/client' })
        .pipe(dest('dist/client'));
}

function jsBundle() {
    return src([
        'node_modules/html2canvas/dist/html2canvas.min.js',
        'node_modules/uuid/dist/umd/uuidv4.min.js',
        'node_modules/amazon-cognito-identity-js/dist/amazon-cognito-identity.min.js',
        'src/assets/js/token.js',
        'src/assets/plugins/jquery-3.6.0.min.js',
        'src/assets/plugins/ejs.min.js',
        'src/assets/js/script.theme.js',
        'src/assets/plugins/popperjs-2.11.8.min.js',
        'src/assets/plugins/bootstrap/bootstrap.min.js',
        'src/assets/js/bootstrap.autocomplete.js',
        'src/assets/plugins/moment-with-locales.min.js',
        'src/assets/plugins/flatpickr-4.6.13.min.js',
        'src/assets/plugins/axios-1.4.0.min.js',
        'src/assets/plugins/select2/select2.full.min.js',
        'src/assets/plugins/sweetalert2-11.7.12.min.js',
        'src/assets/plugins/nprogress.js',
        'src/assets/plugins/jquery.history.js',
        'src/assets/js/exif.js',
        'src/assets/js/heic2any.min.js',
        'src/assets/js/signature_pad.umd.min.js',
        'src/assets/plugins/markerjs2.js',
        'src/assets/plugins/xlsx.full.min.js',
        'src/assets/plugins/FileSaver.min.js',
        'src/assets/plugins/apexcharts.js',
        'src/assets/js/voice.inspection.v2.js'
    ])
        .pipe(concat('web.bundle.js'))
        .pipe(gulpif(isProd, uglify()))
        .pipe(gulpif(isProd, rename({ suffix: '.min' })))
        .pipe(dest('dist/web/assets/js'));
}

function cssBundle() {
    return src([
        'src/assets/plugins/bootstrap/bootstrap.min.css',
        'src/assets/plugins/flatpickr.min.css',
        'src/assets/plugins/select2/select2.min.css',
        'src/assets/plugins/all.min.css',
        'src/assets/plugins/nprogress.css',
        'src/assets/css/style.plugin.css',
        'src/assets/css/style.bundle.css',
        'src/assets/css/voice.inspection.css'
    ])
        .pipe(concat('web.bundle.css'))
        .pipe(gulpif(isProd, cleanCSS()))
        .pipe(gulpif(isProd, rename({ suffix: '.min' })))
        .pipe(dest('dist/web/assets/css'));
}

function ejsTemplates(done) {
    const templatesDir = 'src/templates/ejs/fields/';
    let output = '';
    if (!fs.existsSync(templatesDir)) {
        return done();
    }
    const files = fs.readdirSync(templatesDir);
    files.forEach(file => {
        if (path.extname(file) === '.html') {
            const templateName = path.basename(file, '.html');
            const content = fs.readFileSync(path.join(templatesDir, file), 'utf8');
            output += `<script id="field-${templateName}-tpl" type="text/x-template">\n${content}\n</script>\n`;
        }
    });
    if (!fs.existsSync('dist/web/templates')) {
        fs.mkdirSync('dist/web/templates', { recursive: true });
    }
    fs.writeFileSync('dist/web/templates/templates.bundle.html', output);
    done();
}

function sectionTemplates(done) {
    const sectionsDir = 'src/templates/section/';
    const indexFilePath = 'dist/web/index.html';
    let combinedSections = '';

    fs.readdir(sectionsDir, (err, files) => {
        if (err) {
            done(err);
            return;
        }
        files.filter(file => path.extname(file) === '.html')
            .forEach(file => {
                const filePath = path.join(sectionsDir, file);
                const content = fs.readFileSync(filePath, 'utf8');
                combinedSections += `<template id="section-${file}" type="text/x-template">\n${content}\n</template>\n`;
                //combinedSections += content + '\n';
            });

        let indexHtml = fs.readFileSync(indexFilePath, 'utf8');

        const placeholder = '<div id="section-templates" style="display:none;"></div>';
        const injection = `<div id="section-templates" style="display:none;">\n${combinedSections}\n</div>`;

        indexHtml = indexHtml.replace(placeholder, injection);

        fs.writeFileSync(indexFilePath, indexHtml, 'utf8');
        done();
    });
}

function createSymlink(done) {
    const target = path.resolve(__dirname, '/Volumes/[C] Windows 11/inetpub/wwwroot/ess103n/Files');
    const linkPath = path.resolve(__dirname, 'dist/Files');

    if (!fs.existsSync(linkPath)) {
        fs.symlinkSync(target, linkPath, 'dir');
    }
    done();
}


function versionReplace() {
    let jsFile = isProd ? '/web/assets/js/web.bundle.min.js' : '/web/assets/js/web.bundle.js';
    let cssFile = isProd ? '/web/assets/css/web.bundle.min.css' : '/web/assets/css/web.bundle.css';

    return src('dist/web/index.html')
        .pipe(
            replace(/\/web\/assets\/js\/web\.bundle(\.min)?\.js/g, `${jsFile}?v=${version}`)
        )
        .pipe(
            replace(/\/web\/assets\/css\/web\.bundle(\.min)?\.css/g, `${cssFile}?v=${version}`)
        )
        .pipe(
            replace(/\/web\/templates\/templates\.bundle\.html/g, `/web/templates/templates.bundle.html?v=${version}`)
        )
        .pipe(
            replace(/__VERSION__/g, version)
        )
        .pipe(
            replace(/__ENV__/g, env)
        )
        .pipe(dest('dist/web/'));
}

function serve() {
    connect.server({
        root: 'dist',
        port: 3010,
        host: '140.smart.my',
        /*port: 3010,
        host: '140.smart.local',*/
        livereload: true
    });
}

function reloadBrowser(done) {
    connect.reload();
    done();
}

function watchFiles() {
    const rebuild = env === 'local' ? buildLocal : buildDev;

    watch(
        ['src/**/*'],
        series(
            rebuild,
            reloadBrowser
        )
    );
}

const buildLocal = series(
    cleanDist,
    createSymlink,
    parallel(copyIndex, copyAssets, copyTemplates, copyClient),
    parallel(jsBundle, cssBundle),
    ejsTemplates,
    /* sectionTemplates, */
    versionReplace
);

const buildDev = series(
    cleanDist,
    parallel(copyIndex, copyAssets, copyTemplates),
    parallel(jsBundle, cssBundle),
    ejsTemplates,
    /* sectionTemplates, */
    versionReplace
);

const buildProd = buildDev;

exports.clean = cleanDist;
exports.buildLocal = buildLocal;
exports.buildDev = buildDev;
exports.buildProd = buildProd;

exports.local = series(buildLocal, parallel(serve, watchFiles));
exports.dev = series(buildDev, parallel(serve, watchFiles));
exports.build = buildProd;
exports.default = buildLocal;