var express = require('express');
var router = express.Router();
var Promise = require('bluebird');
var request = require('request-promise');
var tough = require('tough-cookie');
var domainParser = require('parse-domain');

router.get('/search', function (req, res) {

    var currency = req.query.currency || 'usd';

    if (!req.query.query) {
        return res.status(422).json({'currency': 'currency parameter is required'});
    }

    var domain = domainParser(req.query.query);

    if (!domain) {
        domain = req.query.query.replace(/\.+$/, '');
        domain = domainParser(domain + '.com');
    }

    var FQDN = domain.domain + '.' + domain.tld;
    domain = domain.domain;


    var cookie = new tough.Cookie({
        key: "currency",
        value: currency
    });

    var cookiejar = request.jar();
    cookiejar.setCookie(cookie, 'https://my.godaddy.com');

    const urls = [
        {// lookup the exact domain
            uri: 'https://my.godaddy.com/domainsapi/v1/search/exact?q=' + FQDN + '&key=dpp_search&pc=&ptl=',
            jar: cookiejar
        },
        {// get the recommendations
            uri: 'https://my.godaddy.com/domainsapi/v1/search/spins?pagestart=0&pagesize=20&key=dpp_search&q=' + domain + '&tlds=&source=&maxsld=&pc=&ptl=',
            jar: cookiejar
        }
    ];

    Promise.map(urls, request, {concurrency: 2}).then(function (results) {

        var exact = JSON.parse(results[0]);
        var productId = exact.ExactMatchDomain.ProductId;
        var isDomainAvailable = exact.ExactMatchDomain.IsAvailable == true;
        var queryPrice = {};
        var price = {};

        exact.Products.forEach(function (element) {
            queryPrice[element.ProductId] = element.PriceInfo
        });

        if (isDomainAvailable) {
            price = {
                'signup': queryPrice[productId].CurrentPriceDisplay,
                'renewal': queryPrice[productId].RenewalPriceDisplay
            }
        }

        var recommendations = JSON.parse(results[1]);

        var recommendationsProductPrices = {};
        var recommendationsProduct = [];

        recommendations.Products.forEach(function (element) {
            recommendationsProductPrices[element.ProductId] = {
                'signup': element.PriceInfo.CurrentPriceDisplay,
                'renewal': element.PriceInfo.RenewalPriceDisplay
            };
        });

        recommendations.RecommendedDomains.forEach(function (element) {
            recommendationsProduct.push({
                'fqdn': element.Fqdn,
                'price': recommendationsProductPrices[element.ProductId]
            });
        });

        var result = {
            'domian': exact.ExactMatchDomain.Fqdn,
            'is_available': isDomainAvailable,
            'currency': currency,
            'price': price,
            'recommendations': recommendationsProduct
        };

        return res.json(result);

    }, function (err) {

        return res.status(500).json({'error': 'something went wrong'});
    });

});

module.exports = router;
