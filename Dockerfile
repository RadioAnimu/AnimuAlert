FROM node:lts-alpine3.20
WORKDIR /api
COPY . .
RUN npm i
ENTRYPOINT [ "node" ]
CMD ["index.js"] 