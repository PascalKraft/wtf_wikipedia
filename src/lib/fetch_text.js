'use strict';
//grab the content of any article, off the api
var request = require('superagent');
var site_map = require('../data/site_map');
var redirects = require('../parse/parse_redirects');
var headers = {};
var legal_headers = ['Accept', 'Accept-Charset', 'Accept-Encoding', 'Accept-Language', 'Authorization', 'Cache-Control', 'Connection', 'Cookie', 'Content-Length', 'Content-MD5', 'Content-Type', 'Date', 'Expect', 'From', 'Host', 'If-Match', 'If-Modified-Since', 'If-None-Match', 'If-Range', 'If-Unmodified-Since', 'Max-Forwards', 'Pragma', 'Proxy-Authorization', 'Range', 'Referer','TE','Transfer-Encoding','Upgrade','User-Agent', 'Via', 'Warning'];

var protocol = 'https';
var base = 'wikipedia.org/w/'

var exports = module.exports = {};

exports.set_headers = function(in_header) {
	for(var name_of_entry in legal_headers) {
		if(in_header.hasOwnProperty(name_of_entry)) {
			headers[name_of_entry] = headers[name_of_entry];
		}
	}
};

exports.set_protocol = function(in_protocol) {
	if(in_protocol in ['https' ,'http']) {
		protocol = in_protocol;
	}
};

exports.set_base = function(in_base) {
	base = in_base;
};

exports.fetch = function(page_identifier, lang_or_wikiid, cb) {
  lang_or_wikiid = lang_or_wikiid || 'en';
  var identifier_type = 'titles';
  if (page_identifier.match(/^[0-9]*$/) && page_identifier.length > 3) {
    identifier_type = 'curid';
  }
  var url;
  if (site_map[lang_or_wikiid]) {
    url = site_map[lang_or_wikiid] + '/w/api.php';
  } else {
    url = protocol + '://' + lang_or_wikiid + '.' + base + 'api.php';
  }
  //we use the 'revisions' api here, instead of the Raw api, for its CORS-rules..
  url += '?action=query&prop=revisions&rvlimit=1&rvprop=content&format=json&origin=*';
  url += '&' + identifier_type + '=' + page_identifier;

  request
    .get(url)
	  .set(headers)
    .end(function(err, res) {
      if (err) {
        console.warn(err);
        cb(null);
        return;
      }
      var pages = res.body.query.pages || {};
      var id = Object.keys(pages)[0];
      if (id) {
        var page = pages[id];
        if (page && page.revisions && page.revisions[0]) {
          var text = page.revisions[0]['*'];
          if (redirects.is_redirect(text)) {
            var result = redirects.parse_redirect(text);
            fetch(result.redirect, lang_or_wikiid, cb); //recursive
            return;
          }
          cb(text);
        } else {
          cb(null);
        }
      }
    });
};

// module.exports = fetch;

// fetch('On_A_Friday', 'en', function(r) { // 'afwiki'
//   console.log(JSON.stringify(r, null, 2));
// });
