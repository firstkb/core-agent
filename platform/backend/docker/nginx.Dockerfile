
# ESS Smart API NGINX Docker Image
# Maintainer: eSafetySystems IT <it@esafetysystems.com>

# docker build -t nginx:alpine -f nginx.Dockerfile .
# docker run  -it -p 80:80 nginx:alpine

FROM NGINX_BASE_IMAGE

ARG NGINX_PATH='/etc/nginx'
ARG OPENR_PATH='/usr/local/openresty/nginx'

COPY nginx-default.conf $NGINX_PATH/conf.d/default.conf
COPY nginx.conf         $OPENR_PATH/conf/nginx.conf

