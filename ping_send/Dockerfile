FROM alpine:latest

RUN apk add --update nodejs
RUN apk add --update nmap
COPY . /src
RUN cd /src; npm install

CMD ["node","/src/ping_send.js"]

