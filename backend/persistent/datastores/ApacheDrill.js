import fetch from 'node-fetch';
import * as S3 from './S3.js';


export function connect(connection) {
    const {host, port} = connection;
    const url = `${host}:${port}/query.json`;
    return fetch(url);
}

export function query(queryStatement, connection) {
    const {host, port} = connection;
    const url = `${host}:${port}/query.json`;

    return new Promise((resolve, reject) => {
        fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify({
                queryType: 'SQL',
                query: queryStatement
            })
        })
        .then(response => response.json())
        .then(json => {
            const {errorMessage, rows, columns} = json;
            if (errorMessage) {
                reject({message: errorMessage});
            } else {
                resolve({
                    rows: rows.map(row => columns.map(c => row[c])),
                    columnnames: columns
                });
            }
        })
        .catch(reject);
    });

}

export function storage(connection) {
    const {host, port} = connection;
    const url = `${host}:${port}/storage.json`;
    return fetch(url).then(res => res.json());
}

// TODO - Make this more flexible?
export function listS3Files(connection) {
    return S3.files({
        bucket: connection.bucket,
        accessKeyId: connection.accessKeyId,
        secretAccessKey: connection.secretAccessKey
    });
}
