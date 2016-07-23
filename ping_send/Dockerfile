#FROM alpine:latest
FROM python:2

#RUN apk add --update python python-dev py-pip build-base
RUN apt-get update
RUN apt-get install -y build-essential
RUN apt-get install -y vim 

RUN pip install --upgrade pip
RUN pip install virtualenv
RUN pip install iofabric
RUN pip install ws4py

COPY . /src
#CMD ["printenv"]
#CMD ["/bin/bash"]
CMD ["python", "/src/ping_send.py"]
#CMD ["python", "/src/idle.py"]

