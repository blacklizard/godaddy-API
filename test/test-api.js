var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../app');
var should = chai.should();

chai.use(chaiHttp);

describe('GET /search', function () {
    it('it should receive 422 error', function (done) {
        chai.request(server).get('/search').end(function (err, res) {
            res.should.have.status(422);
            done();
        });
    });
});

describe('GET /search?query=blacklizard.com', function () {
    it('it should query status of blacklizard.com availability', function (done) {
        chai.request(server).get('/search?query=blacklizard.com').end(function (err, res) {
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('domain').eql('blacklizard.com');
            res.body.should.have.property('is_available').eql(false);
            done();
        });
    });
});

describe('GET /search?query=blacklizard.', function () {
    it('it should query status of blacklizard.com availability', function (done) {
        chai.request(server).get('/search?query=blacklizard.').end(function (err, res) {
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('domain').eql('blacklizard.com');
            res.body.should.have.property('is_available').eql(false);
            done();
        });
    });
});

describe('GET /search?query=blacklizard', function () {
    it('it should query status of blacklizard.com availability', function (done) {
        chai.request(server).get('/search?query=blacklizard').end(function (err, res) {
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('domain').eql('blacklizard.com');
            res.body.should.have.property('is_available').eql(false);
            done();
        });
    });
});

describe('GET /search?query=blacklizards.com', function () {
    it('it should query status of blacklizards.com availability', function (done) {
        chai.request(server).get('/search?query=blacklizards.com').end(function (err, res) {
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('domain').eql('blacklizards.com');
            res.body.should.have.property('is_available').eql(true);
            done();
        });
    });
});

describe('GET /search?query=blacklizard.txt', function () {
    it('it should respond with Invalid TLD', function (done) {
        chai.request(server).get('/search?query=blacklizard.txt').end(function (err, res) {
            res.should.have.status(500);
            res.body.should.be.a('object');
            res.body.should.have.property('error').eql('Invalid TLD');
            done();
        });
    });
});