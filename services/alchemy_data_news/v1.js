module.exports = function(RED) {

	var http = require('http');
	var https = require('https');

//    var cfEnv = require("cfenv");
    var util = require("util");
//    var appEnv   = cfEnv.getAppEnv();

	var watson = require('watson-developer-cloud');

	function NewsNode(config) {

    	RED.nodes.createNode(this,config);
    	
    	var node = this;

		this.name = config.name;
		this.key = config.key;
		this.start = config.start;
		this.end = config.end;
		this.max = config.max;
		this.mode = config.node;
		this.custom = config.custom;
		this.query = config.query;
		this.queries = config.queries;
		this.results = config.results;

		this.playEffect = function() {
			node.log('effects');

			var queries=[];
			for (var i=0;i<node.queries.length;i++) {
				var s = {
				    "color": {
				        "components": {
				            "r": node.queries[i].r,
				            "g": node.queries[i].g,
				            "b": node.queries[i].b,
				            "w": node.queries[i].w
				        },
				        "fade": node.queries[i].f,
				        "intensity": node.queries[i].i
				    },
				    "target": {
				        "id": Number(node.queries[i].id),
				        "type": node.queries[i].type
				    },
				    "start_time": node.queries[i].start
				}
				queries.push(s);
			};		

			var data = {
				"name": node.name,
				"duration": Number(node.duration),
				"priority": Number(node.priority),
				"cyclic": node.cyclic,
				"queries": queries
			};

			node.log(JSON.stringify(data));

			var options = {
				host: node.wizardConfig.host,
				port: node.wizardConfig.port,
				path: '/master/effect',
				method: 'POST',
				headers: {'Content-Type' : 'application/json'}

			};

			node.log(JSON.stringify(options));

			var req = http.request(options, function(res) {
				res.setEncoding('utf8');
				res.on('data', function (chunk) {
					node.log('BODY: ' + chunk);
				});
			});
			req.on('error', function(err) {
				node.error("Action Error: "+JSON.stringify(err));
			});
			req.write(JSON.stringify(data));
			req.end();
		};

		this.buildQuery = function(params) {
			var queries=[];
			for (var i=0;i<node.queries.length;i++) {
				q = node.queries[i];
				switch (q.op) {
					case 'cc':
						op1 = "[";
						op2 = "]";
						break;
					case 'nc':
						op1 = "-[";
						op2 = "]";
						break;
					case 'gt':
						op1 = ">";
						op2 = "";
						break;
					case 'ge':
						op1 = ">=";
						op2 = "";
						break;
					case 'lt':
						op1 = "<";
						op2 = "";
						break;
					case 'le':
						op1 = "<=";
						op2 = "";
						break;
				}
				params['q.'+q.field]=op1+q.value+op2;
			}	
		}

		this.buildCustomQuery = function(params) {
			var	values = node.query.split('&');
			for (var i=0;i<values.length;i++) {
				var value = values[i];
				var a = value.indexOf('=');
				var field = value.substr(0,a);
				console.log(field+": "+value.substr(a+1));
				params[field]=value.substr(a+1);
			}	
		}

		this.on('input', function (msg) {
			var alchemy_data_news = watson.alchemy_data_news({
//				api_key: 'b093593670f57d48182e095fc7b03b0485f82259'
				api_key: node.key
			});

/*
			console.log(node.start);
			console.log(node.end);
			console.log(new Date(node.start));
			console.log(new Date(node.end));
			console.log(new Date(node.start).getTime());
			console.log(new Date(node.end).getTime());
*/

			var params = {
				start: new Date(node.start).getTime()/1000, //'now-1d',
				end: new Date(node.end).getTime()/1000, //'now',
				maxResults: node.max,
				outputMode: node.mode,
				return: node.results.toString()
			};

			if (node.custom) {
				this.buildCustomQuery(params);
			} else {
				this.buildQuery(params);
			}

			console.log(params);
			 
			alchemy_data_news.getNews(params, function (err, news) {
				if (err)
					node.error(err);
				else
					node.send({'payload': news});
			});
		});
	}

	RED.nodes.registerType("news",NewsNode);

}


