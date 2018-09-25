FROM nginx
COPY build /opt/nginx/html
COPY nginx.conf/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80/tcp

