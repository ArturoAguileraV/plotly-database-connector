import {expect, assert} from 'chai';
import {head, last} from 'ramda';

import {
    sqlConnections,
    elasticsearchConnections,
    publicReadableS3Connections,
    apacheDrillConnections,
    apacheDrillStorage
} from './utils.js';

import {
    query, connect, files, storage, listS3Files, elasticsearchMappings
} from '../../backend/persistent/datastores/Datastores.js';

const transpose = m => m[0].map((x, i) => m.map(x => x[i]));


describe('SQL - ', function () {
    it('connect connects to a database', function(done) {
        this.timeout(4 * 1000);
        connect(sqlConnections).then(done).catch(done);
    });

    it('query queries a database', function(done) {
        this.timeout(4 * 1000);
        query(
            'SELECT * from ebola_2014 LIMIT 2',
            sqlConnections
        ).then(results => {
            assert.deepEqual(results.rows, [
                ['Guinea', 3, 14, '9.95', '-9.7', '122'],
                ['Guinea', 4, 14, '9.95', '-9.7', '224']
            ]);
            assert.deepEqual(results.columnnames, [
                'country', 'month', 'year', 'lat', 'lon', 'value'
            ]);
            done();
        }).catch(done);
    });
});


describe('Elasticsearch - ', function () {
    it('connect connects to an index', function(done) {
        this.timeout(4 * 1000);
        connect(elasticsearchConnections).then(res => res.json().then(json => {
            assert.deepEqual(
                json[0],
                {
                    'health': 'yellow',
                    'status': 'open',
                    'index': 'plotly_datasets',
                    'pri': '1',
                    'rep': '1',
                    'docs.count': '28187',
                    'docs.deleted': '0',
                    'store.size': '5.8mb',
                    'pri.store.size': '5.8mb'
                }
            );
            assert.deepEqual(
                json[1],
                {
                    'health': 'yellow',
                    'status': 'open',
                    'index': 'sample-data',
                    'pri': '1',
                    'rep': '1',
                    'docs.count': '200011',
                    'docs.deleted': '0',
                    'store.size': '42.8mb',
                    'pri.store.size': '42.8mb'
                }
            );

            /*
             * The 3rd index is frequently changing, so just test against
             * an immutable field
             */
            assert.equal(json[2].index, 'live-data');

            assert.equal(res.status, 200);

            done();
        })).catch(done);
    });

    it('mappings returns mappings', function(done) {
        elasticsearchMappings(elasticsearchConnections).then(json => {
            assert.deepEqual(
                json,
                {
                    'live-data': {
                        'mappings': {
                            'test-type': {
                                'properties': {
                                    'date': {
                                        'type': 'date',
                                        'format': 'strict_date_optional_time||epoch_millis'
                                    },
                                    'string-1': {'type': 'string'},
                                    'string-2': {'type': 'string'},
                                    'token': {
                                        'analyzer': 'standard',
                                        'type': 'token_count'
                                    },
                                    'integer': {'type': 'integer'},
                                    'double': {'type': 'double'},
                                    'boolean': {'type': 'boolean'},
                                    'geo_point-1': {'type': 'geo_point'},
                                    'geo_point-2': {'type': 'geo_point'},
                                    'geo_point-3': {'type': 'geo_point'},
                                    'ip': {'type': 'ip'}
                                }
                            }
                        }
                    },
                    'plotly_datasets': {
                      'mappings': {
                        'consumer_complaints': {
                            'properties': {
                              'Company': {'type': 'string'},
                              'Company response': {'type': 'string'},
                              'Complaint ID': {'type': 'integer'},
                              'Consumer disputed?': {'type': 'string'},
                              'Date received': {'type': 'date', 'format': 'strict_date_optional_time'},
                              'Date sent to company': {'type': 'date', 'format': 'strict_date_optional_time'},
                              'Issue': {'type': 'string'},
                              'Product': {'type': 'string'},
                              'State': {'type': 'string'},
                              'Sub-issue': {'type': 'string'},
                              'Sub-product': {'type': 'string'},
                              'Timely response?': {'type': 'string'},
                              'ZIP code': {'type': 'integer'}
                            }
                        },
                        'ebola_2014': {
                          'properties': {
                            'Country': {
                              'type': 'string'
                            },
                            'Lat': {
                              'type': 'float'
                            },
                            'Lon': {
                              'type': 'float'
                            },
                            'Month': {
                              'type': 'integer'
                            },
                            'Value': {
                              'type': 'float'
                            },
                            'Year': {
                              'type': 'integer'
                            },
                            'index': {
                              'type': 'integer'
                            }
                          }
                        }
                      }
                    },
                    'sample-data': {
                      'mappings': {
                        'test-scroll': {
                            'properties': {
                                'first': {
                                    'type': 'float'
                                },
                                'second': {
                                    'type': 'float'
                                },
                                'third': {
                                    'type': 'float'
                                },
                                'fourth': {
                                    'type': 'float'
                                },
                                'fifth': {
                                    'type': 'float'
                                }
                            }
                        },
                        'test-type': {
                          'properties': {
                            'my-boolean-1': {
                              'type': 'boolean'
                          },
                            'my-boolean-2': {
                              'type': 'boolean'
                          },
                            'my-date-1': {
                              'format': 'strict_date_optional_time||epoch_millis',
                              'type': 'date'
                          },
                            'my-date-2': {
                              'format': 'strict_date_optional_time||epoch_millis',
                              'type': 'date'
                          },
                            'my-geo-point-1': {
                              'type': 'geo_point'
                          },
                            'my-geo-point-2': {
                              'type': 'geo_point'
                          },
                            'my-number-1': {
                              'type': 'long'
                          },
                            'my-number-2': {
                              'type': 'long'
                          },
                            'my-string-1': {
                              'type': 'string'
                          },
                            'my-string-2': {
                              'type': 'string'
                            }
                          }
                      },
                    'test-scroll': {
                      'properties': {
                        'fifth': {
                          'type': 'float'
                      },
                        'first': {
                          'type': 'float'
                      },
                        'fourth': {
                          'type': 'float'
                      },
                        'second': {
                          'type': 'float'
                      },
                        'third': {
                          'type': 'float'
                      }
                     }
                 }
                  }
                }
              }
            );
            done();
        }).catch(done);
    });

    it('query queries an elasticsearch index', function(done) {
        this.timeout(4 * 1000);
        query(JSON.stringify({
                body: {
                    query: {
                        query_string: {
                            query: '*'
                        }
                    },
                    from: 0,
                    size: 1000
                },
                index: 'sample-data',
                type: 'test-type'
            }),
            elasticsearchConnections
        ).then(results => {
            assert.deepEqual(results, {
                columnnames: [
                    'my-date-1',
                    'my-string-1', 'my-string-2',
                    'my-date-2',
                    'my-number-1', 'my-number-2',
                    'my-geo-point-2', 'my-geo-point-1',
                    'my-boolean-2', 'my-boolean-1'
                ],
                rows: transpose([
                    [
                        '2015-01-01T12:30:40Z',
                        '2015-10-04T12:35:10Z',
                        '2015-02-02T12:45:02Z',

                        '2015-04-12T12:55:05Z',
                        '2016-02-15T08:10:10Z',

                        '2016-01-10T06:05:02Z',
                        '2016-02-11T07:02:01Z',
                        '2012-03-13T05:01:05Z',

                        '2010-01-16T01:10:50Z',
                        '2011-04-19T02:15:38Z',

                        '2012-02-20T03:01:28Z'
                    ],

                    [
                        'NYC', 'NYC', 'NYC', 'Paris', 'Paris',
                        'Tokyo', 'Tokyo', 'Tokyo', 'SF', 'Sf', 'Montreal'
                    ],
                    [
                        'USA', 'USA', 'USA', 'France', 'France',
                        'Japan', 'Japan', 'Japan', 'USA', 'USA', 'Canada'
                    ],

                    [
                        '1915-01-01T12:30:40Z',
                        '1915-10-04T12:35:10Z',
                        '1915-02-02T12:45:02Z',

                        '1915-04-12T12:55:05Z',
                        '1916-02-15T08:10:10Z',

                        '1916-01-10T06:05:02Z',
                        '1916-02-11T07:02:01Z',
                        '1912-03-13T05:01:05Z',

                        '1910-01-16T01:10:50Z',
                        '1911-04-19T02:15:38Z',

                        '1912-02-20T03:01:28Z'
                    ],

                    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
                    [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110],

                    // TODO - Should expand these geoPoints out into 2 columns
                    [
                        [-10, -10],
                        [-11, -11],
                        [-12, -12],

                        [-20, -20],
                        [-21, -21],

                        [-30, -30],
                        [-31, -31],
                        [-32, -32],

                        [-40, -40],
                        [-41, -41],

                        [-50, -50]
                    ],

                    [
                        [10, 10],
                        [11, 11],
                        [12, 12],

                        [20, 20],
                        [21, 21],

                        [30, 30],
                        [31, 31],
                        [32, 32],

                        [40, 40],
                        [41, 41],

                        [50, 50]
                    ],

                    [true, false, true, false, true, false, true, false, true, false, true],
                    [true, true, true, false, false, true, true, true, false, false, true]

                ])
            });
            done();
        }).catch(done);
    });

    it('query queries an elasticsearch index and limits the size', function(done) {
        this.timeout(4 * 1000);
        query(JSON.stringify(
            {
                body: {
                    query: {
                        query_string: {
                            query: '*'
                        }
                    },
                    size: '1'
                },
                // TODO - this should just be 'index' and 'type'
                index: 'sample-data',
                type: 'test-type'
            }),
            elasticsearchConnections
        ).then(results => {
            assert.deepEqual(results, {
                columnnames: [
                    'my-date-1',
                    'my-string-1', 'my-string-2',
                    'my-date-2',
                    'my-number-1', 'my-number-2',
                    'my-geo-point-2', 'my-geo-point-1',
                    'my-boolean-2', 'my-boolean-1'
                ],
                rows: transpose([
                    [
                        '2015-01-01T12:30:40Z'
                    ],
                    [
                        'NYC'
                    ],
                    [
                        'USA'
                    ],
                    [
                        '1915-01-01T12:30:40Z'
                    ],
                    [1],
                    [10],
                    // TODO - Should we expand out geo-point into 2 columns?
                    [
                        [-10, -10]
                    ],
                    [
                        [10, 10]
                    ],
                    [true],
                    [true]
                ])
            });
            done();
        }).catch(done);
    });

    it('query returns more than 10K rows', function(done) {
        this.timeout(60 * 1000);
        query(JSON.stringify(
            {
                body: {
                    query: {
                        query_string: {
                            query: '*'
                        }
                    },
                    size: '10001'
                },
                index: 'sample-data',
                type: 'test-scroll'
            }),
            elasticsearchConnections
        ).then(results => {
            assert.deepEqual(
                {
                    columnnames: results.columnnames.sort(),
                    rows: results.rows.length
                },
                {
                    columnnames:
                        [
                            'fifth',
                            'first',
                            'fourth',
                            'second',
                            'third'
                        ],
                    rows: 10001
                }
            );
            done();
        }).catch(done);
    });

    it('query returns all the data when size is larger than the dataset', function(done) {
        this.timeout(60 * 1000);
        query(JSON.stringify(
            {
                body: {
                    query: {
                        query_string: {
                            query: '*'
                        }
                    },
                    size: '200001'
                },
                index: 'sample-data',
                type: 'test-scroll'
            }),
            elasticsearchConnections
        ).then(results => {
            assert.deepEqual(
                {
                    columnnames: results.columnnames.sort(),
                    rows: results.rows.length
                },
                {
                    columnnames:
                        [
                            'fifth',
                            'first',
                            'fourth',
                            'second',
                            'third'
                        ],
                    rows: 200000
                }
            );
            done();
        }).catch(done);
    });

    it('Returns valid aggregated data', function(done) {
        this.timeout(4 * 1000);
        query(JSON.stringify(
            {
                body: {
                    'query': {
                        'query_string': {
                            'query': '*'
                        }
                    },
                    'aggs': {
                        'agg1': {
                            'histogram': {
                                'interval': 10,
                                'field': 'my-number-1'
                            },
                            'aggs': {
                                'agg2': {
                                    'sum': {
                                        'field': 'my-number-2'
                                    }
                                }
                            }
                        }
                    },
                    'size': 2
                },
                // TODO - this should just be 'index' and 'type'
                index: 'sample-data',
                type: 'test-type'
            }),
            elasticsearchConnections
        ).then(results => {
            assert.deepEqual(results, {
                columnnames: [
                    'my-number-1',
                    'sum of my-number-2'
                ],
                rows: [
                    [0, 450],
                    [10, 210]
                ]
            });
            done();
        }).catch(done);

    });

});

describe('S3 - Connection', function () {
    it('connect succeeds with the right connection', function(done) {
        this.timeout(4 * 1000);
        connect(publicReadableS3Connections).then(done).catch(done);
    });

    it('connect fails with the wrong connection', function(done) {
        this.timeout(4 * 1000);
        connect({dialect: 's3', accessKeyId: 'asdf', secretAccessKey: 'fdas'})
        .then(() => done('Error - should not have succeeded'))
        .catch(err => done());
    });

    it('query parses S3 CSV files', function(done) {
        this.timeout(20 * 1000);
        query('5k-scatter.csv', publicReadableS3Connections)
        .then(grid => {
            assert.deepEqual(grid.rows[0], ['-0.790276857291', '-1.32900495883']);
            assert.deepEqual(grid.rows.length, 5 * 1000);
            assert.deepEqual(grid.columnnames, ['x', 'y']);
            done();
        }).catch(done);
    });

    it('files lists s3 files', function(done) {
        this.timeout(5 * 1000);
        files(publicReadableS3Connections)
        .then(files => {
            assert.deepEqual(
                JSON.stringify(files[0]),
                JSON.stringify({
                    'Key': '311.parquet/._SUCCESS.crc',
                    'LastModified': '2016-10-26T03:27:31.000Z',
                    'ETag': '"9dfecc15c928c9274ad273719aa7a3c0"',
                    'Size': 8,
                    'StorageClass': 'STANDARD',
                    'Owner': {
                        'DisplayName': 'chris',
                        'ID': '655b5b49d59fe8784105e397058bf0f410579195145a701c03b55f10920bc67a'
                    }
                })
            );
            done();
        }).catch(done);
    });

});

describe('Apache Drill - Connection', function () {
    it('connects', function(done) {
        connect(apacheDrillConnections)
        .then(res => done())
        .catch(done);
    });

    it('storage returns valid apache drill storage items', function(done) {
        this.timeout(10 * 1000);
        storage(apacheDrillConnections)
        .then(config => {
            assert.deepEqual(
                config, apacheDrillStorage);
            done();
        }).catch(done);
    });

    it('s3-keys returns a list of files in the s3 bucket', function(done) {
        this.timeout(10 * 1000);
        listS3Files(apacheDrillConnections)
        .then(files => {
            assert.deepEqual(
                JSON.stringify(files[0]),
                JSON.stringify({
                    'Key': '311.parquet/._SUCCESS.crc',
                    'LastModified': '2016-10-26T03:27:31.000Z',
                    'ETag': '"9dfecc15c928c9274ad273719aa7a3c0"',
                    'Size': 8,
                    'StorageClass': 'STANDARD',
                    'Owner': {
                        'DisplayName': 'chris',
                        'ID': '655b5b49d59fe8784105e397058bf0f410579195145a701c03b55f10920bc67a'
                    }
                })
            );
            done();
        }).catch(done);
    });

    it('query parses parquet files on S3', function(done) {
        this.timeout(20 * 1000);
        query('SELECT * FROM s3.root.`sample-data.parquet` LIMIT 10', apacheDrillConnections)
        .then(grid => {

            /*
             * TODO - For some reason, the date rows (columns 5-7)
             * come out looking like "[B@15477e8a".
             * Skip these rows for now.
             */

            assert.deepEqual(
                grid.rows[0].slice(0, 5),
                [
                     '0',

                     'NYC',
                     'USA',

                     '1',
                     '10'
                 ]
             );

             assert.deepEqual(
                 grid.rows[0].slice(7, 11),
                 [
                     'true',
                     'true',

                     '[10, 10]',
                     '[-10, -10]'
                 ]
            );

            assert.deepEqual(
                grid.columnnames,
                [
                    '_c0',

                    'my-string-1',
                    'my-string-2',

                    'my-number-1',
                    'my-number-2',

                    'my-date-1',
                    'my-date-2',

                    'my-boolean-1',
                    'my-boolean-2',

                    'my-geo-point-1',
                    'my-geo-point-2'
                ]
            );
            done();
        }).catch(done);
    });
});
