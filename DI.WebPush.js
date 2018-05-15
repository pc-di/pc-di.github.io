// NOTE IMPORTANTE: ce fichier n'est pas pr�vu pour �tre utilis� seul. Il est pr�vu pour �tre inclus dans un package minifi�
// Voir /tests/mmg/Minify.aspx

// pseudo-namespaces
if (window['DI'] == null) window['DI'] = {};
if (window['DI'].util == null) window['DI'].util = {};

(function (util) // pseudo-namspace
{
	"use strict";

	// --------------------------------------------------------------------------------------------------------------------

	function getObjType(obj)
	{
		var clas = Object.prototype.toString.call(obj).slice(8, -1);
		return clas;
	}
	util.getObjType = getObjType;

	/**
	  * Exemple d'utilisation :
	  *    if (is('String', variable)) { }
	  */
	function is(type, obj)
	{
		var clas = Object.prototype.toString.call(obj).slice(8, -1);
		return obj !== undefined && obj !== null && clas === type;
	}
	util.is = is;

	/** Ce que cette fonction fait de plus que is('Number', variable) est de retourner faux pour NaN ou Infinity */
	function isNumber(n) { return !isNaN(parseFloat(n)) && isFinite(n); }
	util.isNumber = isNumber;

	/** V�rifie si un nombre est un nombre entier */
	function isInt(n) { return isFinite(n) && n % 1 === 0; }
	util.isInt = isInt;

	/** Pour quand une fonction JS retourne un objet "array-like" mais qu'on veut un vrai array */
	util.convertToArray = function (elems)
	{
		var array = [];
		for (var i = 0; i < elems.length; i++)
			array.push(elems[i]);
		return array;
	};

	function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
	util.clone = clone;

	function methodRef(obj, fn) 
	{
		if (fn.bind)
		{
			return fn.bind(obj);
		}
		else
		{
			// IE8
			var aArgs = []; //Array.prototype.slice.call(arguments, 1);
			var fNOP = function () { };
			var fBound = function ()
			{
				return fn.apply(obj, aArgs.concat(Array.prototype.slice.call(arguments)));
			};

			fNOP.prototype = fn.prototype;
			fBound.prototype = new fNOP();
			return fBound;
		}
	}
	util.methodRef = methodRef;

	/** D�terminer si le navigateur est IE <= 8 */
	util.isIE8OrOlder = function ()
	{
		return (window.attachEvent != null && window.addEventListener == null);
	};

	/** D�terminer si le navigateur est IE <= 9 */
	util.isIE9OrOlder = function ()
	{
		// "performance" a �t� introduit sur IE10, on peut se servir de �a pour d�tecter le browser
		return util.isIE8OrOlder() || (document.documentMode != null && (window.performance == null || document.documentMode < 10));
	};

	util.parseInt = function (strInt)
	{
		if (strInt == null || strInt === '' || !isFinite(strInt) || (strInt % 1) !== 0)
			throw new Error("Not an int : '" + strInt + "'");
		return parseInt(strInt, '10'); // il FAUT sp�cifier la base 10, sinon certains browsers pensent qu'un input comme '07' est en octal...
	};

	util.getURLParameters = function ()
	{
		var paramsStr = window.location.search.slice(1);
		var dic = {};
		if (paramsStr == null || paramsStr == '')
			return dic;
		var parts = decodeURIComponent(paramsStr).split('&');
		for (var i = 0; i < parts.length; i++)
		{
			var pair = parts[i].split('=');
			dic[pair[0]] = pair[1];
		}
		return dic;
	};


	/** Retourne le premier argument non-nul */
	util.coalesce = function ()
	{
		for (var i = 0; i < arguments.length; i++)
		{
			if (arguments[i] != null) return arguments[i];
		}
		return null;
	};

	/** prefixZeros(123, 6) va outputter 000123 */
	util.prefixZeros = function (number, maxDigits) 
	{
		var length = maxDigits - number.toString().length;
		if (length <= 0)
			return number;

		var leadingZeros = new Array(length + 1);
		return leadingZeros.join('0') + number.toString();
	};

	/** Formatte un nombre entier ou flottant selon le format "openfield" (espaces aux milliers, deux chiffres
	  * apr�s la virgule si pertinent)
	  */
	util.formatNumber = function (n, decimal, showDecimalsEvenIfZero)
	{
		if (!isInt(n))
		{
			var num;
			if (decimal != null)
				num = Math.pow(10, decimal);
			else
				num = 100;
			// float. Arrondir au nombre de digit pass� en param�tre apr�s la virgule
			n = Math.round(n * num) / num;
		}

		var sRegExp = new RegExp('^(-?[0-9]+)([0-9]{3})');
		var sValue = n + '';

		while (sRegExp.test(sValue))
		{
			sValue = sValue.replace(sRegExp, '$1 $2');
		}

		if (showDecimalsEvenIfZero)
		{
			if (sValue.indexOf('.') == -1)
				sValue = sValue + '.';
			var afterDecimalPoint = sValue.afterLast('.').length;
			for (var i = afterDecimalPoint; i < decimal; i++)
			{
				sValue = sValue + '0';
			}
		}

		return sValue;
	};

	/** Formatte un nombre entier ou flottant selon le format "openfield" (espaces aux milliers, deux chiffres
	* apr�s la virgule si pertinent)
	*
	* Similaire � 'formatNumber', mais contrairement � celle ci les d�cimales seront obligatoirement
	* affich�es m�me si elles valent 0
	*/
	util.formatFloatNumber = function (n, decimal)
	{
		if (decimal == null)
			decimal = 2;

		var num;
		if (decimal != null)
			num = Math.pow(10, decimal);
		else
			num = 100;
		// float. Arrondir au nombre de digit pass� en param�tre apr�s la virgule
		n = Math.round(n * num) / num;

		var sRegExp = new RegExp('(-?[0-9]+)([0-9]{3})');
		var sValue = n + '';

		while (sRegExp.test(sValue))
		{
			sValue = sValue.replace(sRegExp, '$1 $2');
		}

		if (sValue.indexOf('.') == -1)
			sValue += '.0';

		var afterDecimalPoint = sValue.afterLast('.');
		if (afterDecimalPoint.length < decimal)
		{
			for (var i = 0; i < decimal - afterDecimalPoint.length; i++)
			{
				sValue += '0';
			}
		}

		return sValue;
	};

	util.assert = function (expression, message)
	{
		if (!expression)
		{
			if (message == null)
				throw new Error("assertion failure");
			else
				throw new Error(message);
		}
	};

	// --------------------------------------------------------------------------------------------------------------------
	// Module "net"
	// --------------------------------------------------------------------------------------------------------------------

	util.net = {};

	/**
	* @param options.url {String} - requis
	* @param options.data {Dictionary} - si method==POST, les param�tres � poster
	* @param options.success {Function} - Callback appel� quand la r�ponse est re�ue.
	*			Signature: function(string responseText, XMLHttpRequest request) (optionnel)
	* @param options.error {Function} - Callback appel� en cas d'erreur http
				Signature: function(int status, string responseText, XMLHttpRequest request) (optionnel)
	* @param options.method {string} - "GET" ou "POST" (optionnel. default: "POST") 
	*			Si vous voulez utiliser GET, ajoutez manuellement les param�tres � l'URL. 
	* @param options.timeout {int} dur�e du timeout en millisecondes - (optionnel, d�faut: 0 [aucun timeout])
	*/
	util.net.ajax = function (options)
	{
		var ajaxRequest = new XMLHttpRequest();
		ajaxRequest.onreadystatechange = function ()
		{
			if (ajaxRequest.readyState == 4 /* complete */)
			{
				if (ajaxRequest.status == 200)
				{
					if (options.success)
						options.success(ajaxRequest.responseText, ajaxRequest);
				}
				else
				{
					if (options.error)
						options.error(ajaxRequest.status, ajaxRequest.responseText, ajaxRequest);
				}
			}
		};

		var method = (options.method || "POST");
		ajaxRequest.open(method, options.url, true /* async */);
		if (options.timeout != null)
			ajaxRequest.timeout = options.timeout;

		var sendData = null;
		// Note: avec IE10+, ceci pourra �tre remplac� par l'objet FormData
		if (options.data != null)
		{
			sendData = "";
			if (is('String', options.data)) // si d�j� une string, utiliser tel quel (e.g. texte, JSON, XML)
			{
				ajaxRequest.setRequestHeader("Content-type", "text/plain"); // TODO: supporter un datatype plus pr�cis?
				sendData = options.data;
			}
			else if (is('Object', options.data)) // dictionnaire de propri�t�s, utiliser form encoding
			{
				if (method == 'POST')
					ajaxRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				for (var key in options.data)
				{
					if (sendData.length > 0) sendData += "&";
					sendData += encodeURIComponent(key) + "=" + encodeURIComponent(options.data[key]);
				}
			}
			else
			{
				throw new Error('data type');
			}
		}
		ajaxRequest.send(sendData);
	};

	/** Requ�te ajax cross-domaine en utilisant le standard CORS 
	* @param {string} options.url
	* @param {string} options.data - Le format JSON est sugg�r�
	* @param {Function} options.success - Callback � appeler en cas de r�ception de la r�ponse avec succ�s, re�oit un param�tre: (string responseText)
	* @param {Function} options.error - Callback appel� en cas d'erreur http. Re�oit les param�tres: (int status, string text)
	*/
	util.net.corsAjax = function (options)
	{
		try
		{
			var ajaxRequest = new XMLHttpRequest();
			var gotStdCors = ('withCredentials' in ajaxRequest);
			var gotXDomain = (window.XDomainRequest != null);

			if (gotXDomain && !gotStdCors)
			{
				// IE 8 et 9 n'impl�mentent pas le standard, mais ont l'extension XDomainRequest qui fait un peu la m�me chose 
				var xdr = new XDomainRequest();
				xdr.open("POST", options.url);
				//xdr.onprogress = function () { };
				xdr.ontimeout = function () { options.error(408, 'timeout'); };
				xdr.onerror = function () { options.error(500, 'error'); };
				xdr.onload = function () { options.success(xdr.responseText); }
				setTimeout(function () { xdr.send(options.data); }, 0);
			}
			else
			{
				ajaxRequest.open('POST', options.url, true);
				ajaxRequest.setRequestHeader("Content-type", "text/plain");
				ajaxRequest.onreadystatechange = function ()
				{
					//console.log('onreadystatechange',ajaxRequest.readyState);
					if (ajaxRequest.readyState == 4 /* complete */)
					{
						if (ajaxRequest.status == 200)
							options.success(ajaxRequest.responseText);
						else
							options.error(ajaxRequest.status, ajaxRequest.responseText);
					}
				};
				ajaxRequest.send(options.data);
			}
		}
		catch (e)
		{
			options.error(500, 'exception ' + e);
			if (window.console)
				console.error(e);
		}
	};

	// --------------------------------------------------------------------------------------------------------------------
	// Module "string"
	// --------------------------------------------------------------------------------------------------------------------

	var string = util.string = {};
	string.trim = function (str)
	{
		return str.replace(/^\s+|\s+$/g, '');
	};

	/** exemple:
		util.string.formatTemplate('Hello {firstName} {lastName}!', { 
			'{firstName}': 'John', 
			'{lastName}': 'Doe'
		}) 
	*/
	string.formatTemplate = function (str, values)
	{
		return str.replace(/([{]\w+[}])/g,
			function (match, contents, offset, s)
			{
				if (values[match] != null)
					return values[match];
				else
					return match;
			}
		);
	};


	// --------------------------------------------------------------------------------------------------------------------
	// Module "datetime"
	// --------------------------------------------------------------------------------------------------------------------

	var datetime = util.datetime = {};

	/** Construit un objet Date avec une validation am�lior�e par rapport � l'objet natif de javascript, retourne null si la date est invalide */
	datetime.buildDateWithStrictValidation = function (yy, MM, dd, HH, mm, ss)
	{
		var date = new Date(yy, MM, dd, HH, mm, ss, 0 /* milliseconds */);

		// L'objet javascript Date va essayer de s'auto-ajuster quand l'input est invalide. On veut pas �a.
		if (date.getFullYear() != yy || date.getMonth() != MM || date.getDate() != dd ||
			date.getHours() != HH || date.getMinutes() != mm || date.getSeconds() != ss)
		{
			return null;
		}
		else
		{
			return date;
		}
	};

	/** Parse une date au format 'yyyy.MM.dd HH:mm:ss' ou 'yyyy.MM.dd HH:mm' ou 'yyyy.MM.dd'
	* Support aussi les formats de workflow : 'yyyy-MM-dd HH:mm:ss' ou 'yyyy-MM-dd HH:mm' ou 'yyyy-MM-dd'
	* Retourne null si l'input ne correspond pas � un de ces formats
	*/
	datetime.parseOFSYSDateTime = function (inputString)
	{
		var dateRegex1 = /^(\d+)[.-](\d+)[.-](\d+) (\d+):(\d+):(\d+)$/gm;
		var matches = dateRegex1.exec(inputString);
		var date = null;

		if (matches != null && matches.length == 7)
		{
			// match 0 is the entire string
			var yy = util.parseInt(matches[1]);
			var MM = util.parseInt(matches[2]) - 1;
			var dd = util.parseInt(matches[3]);
			var HH = util.parseInt(matches[4]);
			var mm = util.parseInt(matches[5]);
			var ss = util.parseInt(matches[6]);
			date = util.datetime.buildDateWithStrictValidation(yy, MM, dd, HH, mm, ss);
		}
		else
		{
			var dateRegex2 = /^(\d+)[.-](\d+)[.-](\d+) (\d+):(\d+)$/gm;
			matches = dateRegex2.exec(inputString);
			if (matches != null && matches.length == 6)
			{
				// match 0 is the entire string
				var yy = util.parseInt(matches[1]);
				var MM = util.parseInt(matches[2]) - 1;
				var dd = util.parseInt(matches[3]);
				var HH = util.parseInt(matches[4]);
				var mm = util.parseInt(matches[5]);
				date = util.datetime.buildDateWithStrictValidation(yy, MM, dd, HH, mm, 0 /* ss */);
			}
			else
			{
				var dateRegex3 = /^(\d+)[.-](\d+)[.-](\d+)$/gm;
				matches = dateRegex3.exec(inputString);

				if (matches != null && matches.length == 4)
				{
					// match 0 is the entire string
					var yy = util.parseInt(matches[1]);
					var MM = util.parseInt(matches[2]) - 1;
					var dd = util.parseInt(matches[3]);
					date = util.datetime.buildDateWithStrictValidation(yy, MM, dd, 0 /* HH */, 0 /* mm */, 0 /* ss */);
				}
			}
		}
		return date;
	};

	datetime.parseOFSYSTime = function (inputString)
	{
		var timeRegex = /^(\d+):(\d+):(\d+)$/gm;
		var matches = timeRegex.exec(inputString);
		if (matches != null && matches.length == 4)
		{
			// match 0 is the entire string
			var HH = util.parseInt(matches[1]);
			var mm = util.parseInt(matches[2]);
			var ss = util.parseInt(matches[3]);
			if (util.datetime.buildDateWithStrictValidation(2001, 1, 1, HH, mm, ss) != null) // valider que l'heure a du sens
				return { HH: HH, mm: mm, ss: ss };
			else
				return null;
		}
		else
		{
			var timeRegex2 = /^(\d+):(\d+)$/gm;
			var matches = timeRegex2.exec(inputString);
			if (matches != null && matches.length == 3)
			{
				// match 0 is the entire string
				var HH = util.parseInt(matches[1]);
				var mm = util.parseInt(matches[2]);

				if (util.datetime.buildDateWithStrictValidation(2001, 1, 1, HH, mm, 0) != null) // valider que l'heure a du sens
					return { HH: HH, mm: mm, ss: 0 };
				else
					return null;
			}
		}
		return null;
	};

	// --------------------------------------------------------------------------------------------------------------------
	// Module "classes"
	// --------------------------------------------------------------------------------------------------------------------

	var classes =
		{
			DeclareClassWithVariables: function (classContent)
			{
				var theClass = classes.DeclareClass(true, classContent.methods, classContent.name, classContent.variables);

				if (classContent.static != null)
				{
					//var isOldIE = ($.browser.msie == true && $.browser.version < 9);
					theClass['__STATIC__'] = classContent.static;
					for (var key in classContent.static)
					{
						theClass[key] = classContent.static[key];

						// offrir un acc�s aux members static en passant par "this" aussi
						//if (!isOldIE && theClass.prototype[key] == undefined)
						//{
						//	(function (key)
						//	{
						//		Object.defineProperty(theClass.prototype, key, {get : function() { return theClass[key]; },
						//					   set : function(newValue){ theClass[key] = newValue; },
						//					   enumerable : true,
						//					   configurable : true});
						//	})(key);
						//}
					}
				}

				return theClass;
			},

			DeclareClass: function (seal, classContent, className, variables)
			{
				var classInstanciator = (function ()
				{
					this.ClassName = className;
					if (variables != null)
					{
						for (var key in variables) 
						{
							this[key] = (variables[key] != null && (is('Object', variables[key]) || is('Array', variables[key])) ? clone(variables[key]) : variables[key]);
						}
						if (seal && Object.seal != null)
							Object.seal(this);
						if (this.init != null)
							this.init.apply(this, arguments);
					}
				});

				classInstanciator.prototype = classContent;
				classes.AddCommonClassMethods(classInstanciator);
				classInstanciator.Variables = variables;
				classInstanciator.ClassName = className;

				// ajouter des r�f�rences aux m�thodes du protoype directement sur la classe. Permettra d'aller chercher des r�f�rences
				// aux m�thodes en faisant "ClassName.MethodName" plutot que le defaut "ClassName.prototype.MethodName"
				for (var methodName in classContent)
				{
					var method = classContent[methodName];
					if (method != null)
						classInstanciator[methodName] = method;
				}

				return classInstanciator;
			},

			AddCommonClassMethods: function (classInstanciator)
			{
				classInstanciator.prototype.CallMethod = function (fn)
				{
					return methodRef(this, fn);
				};
				//classInstanciator.prototype.CallBaseMethod = function (fnName) // OBSOLETE, utiliser "CallMethod" � la place
				//{
				//	return classInstanciator.BasePrototype[fnName].bind(this);
				//};
				//classInstanciator.ExtendWithoutSealing = function (methodList, className)
				//{
				//	return classes.ExtendClass(false, this, methodList, className, null);
				//};
				classInstanciator.Extend = function (classContent)
				{
					//var isOldIE = ($.browser.msie == true && $.browser.version < 9);
					var theClass = classes.ExtendClass(true, this, classContent.methods, classContent.name, classContent.variables);

					if (classInstanciator['__STATIC__'] != null)
					{
						for (var key in classInstanciator['__STATIC__'])
						{
							theClass[key] = classInstanciator['__STATIC__'][key];
						}
					}

					if (classContent.static != null)
					{
						for (var key in classContent.static)
						{
							theClass[key] = classContent.static[key];

							// offrir un acc�s aux members static en passant par "this" aussi
							//if (!isOldIE && theClass.prototype[key] == undefined)
							//{
							//	(function (key)
							//	{
							//		Object.defineProperty(theClass.prototype, key, {get : function() { return theClass[key]; },
							//						set : function(newValue){ theClass[key] = newValue; },
							//						enumerable : true,
							//						configurable : true});
							//	})(key);
							//}
						}
					}

					return theClass;
				};
			},

			ExtendClass: function (seal, parent, methodList, className, variables)
			{
				var classInstanciator;
				if (Object.create != null)
				{
					var classContent = {};
					for (var key in methodList)
					{
						var method = methodList[key];
						if (method != null)
						{
							//methodList[key].ofsysName = key;

							classContent[key] =
								{
									value: methodList[key],
									enumerable: true,
									configurable: true,
									writable: true
								};
						}
						else
						{
							// Si on arrive pas � y acc�der directement, c'est peut-�tre un getter-setter
							var getter = Object.getOwnPropertyDescriptor(methodList, key).get;
							var setter = Object.getOwnPropertyDescriptor(methodList, key).set;
							if (getter != null && setter != null)
							{
								classContent[key] =
									{
										configurable: false,
										get: getter,
										set: setter
									};
							}
							else if (getter != null)
							{
								classContent[key] =
									{
										configurable: false,
										get: getter
									};
							}
							else if (setter != null)
							{
								classContent[key] =
									{
										configurable: false,
										set: setter
									};
							}
						}
					}

					if (parent.Variables != null)
					{
						var new_variables = {};
						for (var key in parent.Variables)
						{
							new_variables[key] = parent.Variables[key];
						}
						if (variables != null)
						{
							for (var key in variables)
							{
								new_variables[key] = variables[key];
							}
						}
						variables = new_variables;
					}

					var classInstanciator = (function ()
					{
						this.ClassName = className;
						if (variables != null)
						{
							for (var key in variables) 
							{
								this[key] = (variables[key] != null && (is('Object', variables[key]) || is('Array', variables[key])) ? clone(variables[key]) : variables[key]);
							}
							if (seal && Object.seal != null)
								Object.seal(this);
							if (this.init != null)
								this.init.apply(this, arguments);
						}
					});

					classInstanciator.prototype = Object.create(parent.prototype, classContent);
					classInstanciator.BasePrototype = parent.prototype;
					classInstanciator.BaseClass = parent;
					classInstanciator.Variables = variables;
					classInstanciator.ClassName = className;
				}
				else
				{
					// Old IE (TODO, �ventuellement retirer, en th�orie on supporte plus IE8)
					//for (var key in methodList)
					//{
					//	methodList[key].ofsysName = key;
					//}

					var classInstanciator = (function ()
					{
						this.ClassName = className;
						if (variables != null)
						{
							for (var key in variables) 
							{
								this[key] = (variables[key] != null && (is('Object', variables[key]) || is('Array', variables[key])) ? clone(variables[key]) : variables[key]);
							}
							if (seal && Object.seal != null)
								Object.seal(this);
							if (this.init != null)
								this.init.apply(this, arguments);
						}
					});

					var newProto = {};
					for (var key in parent.prototype)
						newProto[key] = parent.prototype[key];
					for (var key in methodList)
						newProto[key] = methodList[key];

					classInstanciator.prototype = newProto;
					classInstanciator.BasePrototype = parent.prototype;
					classInstanciator.BaseClass = parent;
					classInstanciator.ClassName = className;
				}

				classes.AddCommonClassMethods(classInstanciator);

				for (var methodName in classContent)
				{
					var method = classContent[methodName];
					if (method.value != null) method = method.value;
					classInstanciator[methodName] = method;
				}

				return classInstanciator;
			}
		};
	util.classes = classes;

})(window['DI'].util);


// NOTE IMPORTANTE: ce fichier n'est pas pr�vu pour �tre utilis� seul. Il est pr�vu pour �tre inclus dans un package minifi�
// Voir /tests/mmg/Minify.aspx

// pseudo-namespaces
if (window['DI'] == null) window['DI'] = {};
if (window['DI'].dom == null) window['DI'].dom = {};

/*
// Import
	var $$ = ofsys.dom;

// Select
	var a = $$.id('element_id'); // Trouver un �l�ment par ID
	var b = $$.select1('#element_id'); // Trouver un �l�ment par s�lecteur CSS
	var c = $$.selectAll('.ClassName'); // Trouver tous les �l�ments correspondant � un s�lecteur CSS
	var d = $$.wrap(document.getElementById('element_id')); // Wrap: cr�er un �l�ment dom � partir d'un �l�ment "natif"
	var e = a.find1('.Child'); // Trouve exactement un enfant par s�lecteur CSS
	var f = a.findAll('.Child'); // Trouve tous les enfants correspondant � un s�lecteur CSS

// Cr�er
	var n = $$.create('div', { 'id': 'mon_div', 'style': { 'color': 'black', 'display': 'inline-block' } });
	$$.body().append(n);

	var m = $$.parse('<div id="mon_div" style="color:black; display: inline-block;">lorem ipsum</div>');
	$$.id('container').append(m);

// Events
	$$.onLoad(function () {
		// Appel� quand tout est charg�
	});

	$$.onReady(function () {
		// appel� quand tout le HTML est charg�, mais sans attendre les images, le CSS, le javascript async
	});

	$$.id('element_id').on('mousedown', function (evt) {
		// Appel� sur click
	});

	$$.id('element_id').on('mousedown', { i: 0, a: "b" }, function (evt, evtData) {
		// Appel� sur click, avec data custom pass�
	});
	
	$$.on(document.body, 'keyup', function (evt) {
		// Enregistrement d'un event sur "body"
	});
	
	$$.on(window, 'keyup', function (evt) {
		// Enregistrement d'un event sur "window"
	});
	
// BrowserWindow
	$$.browserWindow.getSize()
	$$.browserWindow.getScrollWidth(), $$.browserWindow.getScrollHeight()
	$$.browserWindow.getScrollLeft(), $$.browserWindow.getScrollTop()
	$$.browserWindow.setScrollLeft(0), $$.browserWindow.setScrollTop(0)
*/

(function (dom) // pseudo-namspace
{
	"use strict";

	var ofsys = window['DI'];
	var util = ofsys.util;

	// ----------------------- Classe dom.Elem -----------------------
	function OfsysDomElem(elem)
	{
		this.elem = elem;
	}
	dom.Elem = OfsysDomElem;

	OfsysDomElem.prototype =
		{
			// ------------------------------------ Requ�tes et nav ------------------------------------

			findAll: function (selector)
			{
				return dom._selectAll(selector, this.elem);
			},

			find1: function (selector)
			{
				return dom._select1(selector, this.elem);
			},

			/** Retourne le fr�re suivant de cet �l�ment, ou null s'il n'y en a pas */
			nextOrNull: function ()
			{
				var elem;
				if (this.elem.nextElementSibling)
				{
					elem = this.elem.nextElementSibling;
				}
				else
				{
					// IE8
					elem = this.elem.nextSibling;
					while (elem != null && elem.nodeType !== 1)
						elem = elem.nextSibling;
				}
				if (elem == null)
					return null;
				else
					return new dom.Elem(elem);
			},

			/** Retourne le fr�re suivant de cet �l�ment, ou throw s'il n'y en a pas */
			next: function ()
			{
				var elem = this.nextOrNull();
				if (elem == null)
					throw new Error("There is no next element");
				return elem;
			},

			/** Retourne le fr�re pr�c�dent de cet �l�ment, ou null s'il n'y en a pas */
			prevOrNull: function ()
			{
				var elem = null;
				if (this.elem.previousElementSibling)
				{
					elem = this.elem.previousElementSibling;
				}
				else
				{
					// IE8
					elem = this.elem.previousSibling;
					while (elem != null && elem.nodeType !== 1)
						elem = elem.previousSibling;
				}
				if (elem == null)
					return null;
				else
					return new dom.Elem(elem);
			},

			/** Retourne le fr�re pr�c�dent de cet �l�ment, ou throw s'il n'y en a pas */
			prev: function ()
			{
				var elem = this.prevOrNull();
				if (elem == null)
					throw new Error("There is no previous element");
				return elem;
			},

			children: function ()
			{
				var children = this.elem.children;
				// IE8 inclut incorrectement les commentaires dans les enfants
				var array = [];
				for (var i = 0; i < children.length; i++)
				{
					if (children[i].nodeType == 1)
						array.push(children[i]);
				}

				return new dom.OfsysDomElemArray(array);
			},

			parent: function ()
			{
				return new dom.Elem(this.elem.parentNode);
			},

			/** Trouve le premier parent de cet �l�ment correspondant au s�lecteur pass� */
			firstParentMatching: function (selector)
			{
				var parentNode = this.elem.parentNode;

				while (parentNode != null)
				{
					if (dom.wrap(parentNode).is(selector))
						return dom.wrap(parentNode);
					else
						parentNode = parentNode.parentNode;
				}
				return null;
			},

			// ------------------------------------ Propri�t�s et CSS ------------------------------------

			addClass: function (className)
			{
				if (!this.hasClass(className))
					this.elem.className += ' ' + className;
				return this;
			},

			removeClass: function (className)
			{
				var classes = this.elem.className.split(' ');
				var newClasses = [];
				for (var i = 0; i < classes.length; i++)
				{
					if (classes[i] != className)
						newClasses.push(classes[i]);
				}
				this.elem.className = newClasses.join(' ');
				return this;
			},

			classes: function ()
			{
				return this.elem.className.split(' ');
			},

			hasClass: function (className)
			{
				var classes = this.elem.className.split(' ');
				for (var i = 0; i < classes.length; i++)
				{
					if (classes[i] == className)
						return true;
				}
				return false;
			},

			/** Retourne la valeur d'un attribut HTML (id, title, name, etc.) */
			getAttr: function (name)
			{
				return this.elem.getAttribute(name);
			},

			/** Assigne la valeur d'un attribut HTML (id, title, name, etc.) */
			setAttr: function (name, value)
			{
				this.elem.setAttribute(name, value);
				return this;
			},

			/** Retire un attribut HTML (id, title, name, etc.) */
			removeAttr: function (name)
			{
				this.elem.removeAttribute(name);
				return this;
			},

			/** NOTE: contrairement � jQuery, cette propri�t� ne supporte PAS les shorthand CSS.
			  * i.e. on ne pas peut aller chercher la valeur de "border-color", on doit aller checher par exemple "border-top-color".
			  */
			getStyle: function (name)
			{
				var val = this._getComputedStyle(name);
				if (val == null || val == "")
				{
					if (this.elem.style.getPropertyValue)
						val = this.elem.style.getPropertyValue(name);
					else
						val = this.elem.style[dom.util.cssToCamelCase(name)]; // IE8
				}

				if (val === '')
					return null;
				else
					return val;
			},

			_getComputedStyle: function (name)
			{
				if (window.getComputedStyle)
				{
					return window.getComputedStyle(this.elem, null).getPropertyValue(name);
				}
				else if (this.elem.currentStyle) // IE8
				{
					return this.elem.currentStyle[dom.util.cssToCamelCase(name)];
				}
				else
				{
					throw new Error('Unsupported');
				}
			},

			/** Retourne un style local de cet �lement, sans appliquer la cascade des styles des parents ou des fichiers CSS */
			getOwnStyle: function (name)
			{
				var val;
				if (this.elem.style.getPropertyValue)
					val = this.elem.style.getPropertyValue(name);
				else
					val = this.elem.style[dom.util.cssToCamelCase(name)]; // IE8
				if (val === '')
					return null;
				return val;
			},

			/** Assigne un style � cet �l�ment, e.g. elem.setStyle('color', 'black'); */
			setStyle: function (name, value)
			{
				if (this.elem.style.setProperty)
					this.elem.style.setProperty(name, value);
				else
					this.elem.style[dom.util.cssToCamelCase(name)] = value; // IE8
				return this;
			},

			/** Assigne un dictionnaire de styles � cet �l�ment, e.g. elem.setStyles({'color': 'black', 'cursor': 'default'}); */
			setStyles: function (dict)
			{
				for (var key in dict)
					this.setStyle(key, dict[key]);
				return this;
			},

			removeStyle: function (name)
			{
				if (this.elem.style.removeProperty)
					this.elem.style.removeProperty(name);
				else if (this.elem.style.removeAttribute)
					this.elem.style.removeAttribute(dom.util.cssToCamelCase(name));
				else
					throw new Error("Unsupported");
				return this;
			},

			/*
			getProp: function (name)
			{
				return this.elem[name];
			},
			
			setProp: function (name, value)
			{
				this.elem[name] = value;
				return this;
			},
			*/

			/** Valide uniquement sur radio et checkbox */
			isChecked: function ()
			{
				return this.elem.checked;
			},

			/** Valide uniquement sur radio et checkbox */
			setChecked: function (checked)
			{
				this.elem.checked = checked;
				return this;
			},

			/** Valide uniquement sur un select (dropdown) */
			getSelectedOption: function ()
			{
				var value = this.getValue();
				var options = this.findAll('option');
				for (var i = 0; i < options.length(); i++)
				{
					if (options.get(i).getValue() == value)
						return options.get(i);
				}
				return null;
			},

			/** Utile par exemple sur un textbox */
			getValue: function ()
			{
				return this.elem.value;
			},

			/** Utile par exemple sur un textbox */
			setValue: function (newValue)
			{
				this.elem.value = newValue;
				return this;
			},

			// ------------------------------------ Insertion et suppression ------------------------------------

			/** Ajouter un �l�ment pass� en param�tre comme enfant de "this" */
			append: function (elem)
			{
				this.elem.appendChild(elem.elem);
				return this;
			},

			/** Ajouter un �l�ment pass� en param�tre comme premier enfant de "this" */
			prepend: function (elem)
			{
				this.elem.insertBefore(elem.elem, this.elem.firstChild);
				return this;
			},

			/** Ajouter cet �l�ment comme enfant du parent pass� en param�tre */
			appendTo: function (parent)
			{
				parent.elem.appendChild(this.elem);
				return this;
			},

			/** Ajouter un �l�ment pass� en param�tre comme enfant de "this", le pla�ant juste apr�s l'�l�ment pass� en param�tre */
			insertAfter: function (referenceElem)
			{
				referenceElem.elem.parentNode.insertBefore(this.elem, referenceElem.elem.nextSibling);
				return this;
			},

			/** Ajouter un �l�ment pass� en param�tre comme enfant de "this", le pla�ant juste avant l'�l�ment pass� en param�tre */
			insertBefore: function (referenceElem)
			{
				referenceElem.elem.parentNode.insertBefore(this.elem, referenceElem.elem);
				return this;
			},

			/** Retire un �lement, dans le but de le d�truire */
			remove: function ()
			{
				var removed = this.elem.parentNode.removeChild(this.elem);
				this.elem = null;
			},

			/** Retire un �lement, dans le but de le r�ajouter ailleur */
			detach: function ()
			{
				this.elem = this.elem.parentNode.removeChild(this.elem);
				return this;
			},


			// ------------------------------------ Manipulation du contenu ------------------------------------

			/** Vide cet �l�ment (d�truit tous ses enfants) */
			empty: function ()
			{
				this.elem.innerHTML = "";
				return this;
			},

			/** Retourne le contenu plain-text de cet �l�ment (utile sur des �l�ments comme div ou span, pour le texte d'un input voir getValue) */
			getText: function ()
			{
				if ('textContent' in this.elem)
					return this.elem.textContent;
				else if ('innerText' in this.elem) // IE8
					return this.elem.innerText;
				else
					throw new Error("Unsupported");
			},

			/** Assigne le contenu plain-text de cet �l�ment, le texte sera HTML-encod� au besoin
			 * (utile sur des �l�ments comme div ou span, pour le texte d'un input voir setValue) 
			 */
			setText: function (text)
			{
				if ('textContent' in this.elem)
					this.elem.textContent = text;
				else if ('innerText' in this.elem) // IE8
					this.elem.innerText = text;
				else
					throw new Error("Unsupported");
				return this;
			},

			/** Retourne le HTML contenu � l'int�rieur de cet �lement (exclut le tag html de l'�l�ment repr�sent� par this) */
			getInnerHTML: function ()
			{
				return this.elem.innerHTML;
			},

			setInnerHTML: function (value)
			{
				this.elem.innerHTML = value;
				return this;
			},

			/** Retourne le HTML de cet �l�ment et son contenu (inclut le tag html de l'�l�ment repr�sent� par this) */
			getOuterHTML: function ()
			{
				return this.elem.outerHTML;
			},

			setOuterHTML: function (value)
			{
				this.elem.outerHTML = value;
				return this;
			},

			/** Ajoute du contenu plain-text � cet �l�ment, applique du HTML encoding si n�cessaire */
			appendText: function (text)
			{
				this.elem.appendChild(document.createTextNode(text));
				return this;
			},

			/** Ajoute du contenu HTML � cet �l�ment, aucun HTML encoding n'est appliqu� */
			appendHTML: function (html)
			{
				var frag = document.createDocumentFragment();
				var temp = document.createElement('div');
				temp.innerHTML = html;
				while (temp.firstChild)
				{
					frag.appendChild(temp.firstChild);
				}
				this.elem.appendChild(frag);
				return this;
			},

			/** Cr�e une copie de cet �l�ment */
			clone: function ()
			{
				return dom.parse(this.elem.outerHTML);
			},


			// ------------------------------------ �v�nements ------------------------------------

			/**
			* Enregistre un callback � un un event. On peut optionnellement passer un dictionnaire de param�tre qui seront accessibles dans la fonction callback.
			* 	elem.on('click', function (event) { ... });
			* 	elem.on('click', { data: data }, function (event, eventData) { ... });
			* @return La d�finition de l'event, qui pourra �ventuellement �tre repass�e � la m�thode "removeEvent" au besoin
			*/
			on: function (eventType, arg1, arg2)
			{
				return dom.on(this.elem, eventType, arg1, arg2);
			},

			/** Retire un event listener pr�c�demment enregistr� par la m�thode "on"
			 * @param eventRef: L'objet retourn� par la m�thode "on" 
			 */
			removeEvent: function (eventRef)
			{
				if (this.elem.removeEventListener)
					this.elem.removeEventListener(eventRef.eventType, eventRef.fn, false);
				else if (this.elem.detachEvent)
					this.elem.detachEvent('on' + eventRef.eventType, eventRef.fn); // IE8
				else
					throw new Error("Unsupported");
				return this;
			},

			/** D�clenche artificiellement un �v�nement, e.g. elem.trigger('click') */
			trigger: function (eventName)
			{
				if (document.createEvent)
				{
					var event = document.createEvent('HTMLEvents');
					event.initEvent(eventName, true, true);
					event.eventName = eventName;
					this.elem.dispatchEvent(event);
				}
				else if (document.createEventObject) // IE8
				{
					var event = document.createEventObject();
					this.elem.fireEvent("on" + eventName, event);
				}
				else
					throw new Error("Unsupported");
			},


			// ------------------------------------ Coordonn�es ------------------------------------

			getScroll: function ()
			{
				return {
					left: this.elem.scrollLeft,
					top: this.elem.scrollTop
				};
			},

			setScrollLeft: function (newScroll)
			{
				this.elem.scrollLeft = newScroll;
				return this;
			},

			setScrollTop: function (newScroll)
			{
				this.elem.scrollTop = newScroll;
				return this;
			},

			/** Retourne les coordonn�es absolues de cet �l�ment (par rapport au coin sup�rieur gauche du document) et sa taille */
			getBounds: function ()
			{
				var rect = this.elem.getBoundingClientRect();
				var scrollX = dom.browserWindow.getScrollLeft();
				var scrollY = dom.browserWindow.getScrollTop();
				return {
					left: rect.left + scrollX,
					top: rect.top + scrollY,
					right: rect.right + scrollX,
					bottom: rect.bottom + scrollY,
					width: (rect.right == rect.left ? 0 : rect.right - rect.left + 1),
					height: (rect.top == rect.bottom ? 0 : rect.bottom - rect.top + 1)
				};
			},

			/** Taille de l'el�ment (au niveau du border) */
			getWidth: function ()
			{
				return this.elem.offsetWidth;
			},

			/** Taille de l'el�ment (au niveau du border) */
			getHeight: function ()
			{
				return this.elem.offsetHeight;
			},

			/** Retourne les coordonn�es absolues de cet �l�ment (par rapport au coin sup�rieur gauche du document) */
			getCoord: function ()
			{
				var bounds = this.elem.getBoundingClientRect();
				var scrollX = dom.browserWindow.getScrollLeft();
				var scrollY = dom.browserWindow.getScrollTop();
				return { left: bounds.left + scrollX, top: bounds.top + scrollY };
			},

			/** Retourne le "offset parent" de cet �lement, c'est-�-dire le parent en position:relative ou position:absolute,
			 * qui est le parent d�finissant dans quel syst�me de coordonn�es cet �l�ment se trouve
			 */
			getOffsetParent: function ()
			{
				return new dom.Elem(this.elem.offsetParent);
			},

			/** Retourne la cordonn�e locale de cet �l�ment (cette coordonn�e est relative � l'�l�ment "offsetParent")  */
			getRelativeOffset: function ()
			{
				return { left: this.elem.offsetLeft, top: this.elem.offsetTop };
			},


			// ------------------------------------ Misc ------------------------------------

			/** Retourne si cet �l�ment correspond � un s�lecteur CSS, e.g. elem.is('input.MaClasse') */
			is: function (selector)
			{
				if (this.elem.mozMatchesSelector)
				{
					return this.elem.mozMatchesSelector(selector);
				}
				else if (this.elem.webkitMatchesSelector)
				{
					return this.elem.webkitMatchesSelector(selector);
				}
				else if (this.elem.msMatchesSelector)
				{
					return this.elem.msMatchesSelector(selector);
				}
				else 
				{
					var matches = this.elem.parentNode.querySelectorAll(selector);
					for (var i = 0; i < matches.length; i++)
					{
						if (matches[i] === this.elem)
							return true;
					}
					return false;
				}
			},

			/** Met le focus sur cet �l�ment (fonctionne principalement sur des input) */
			focus: function ()
			{
				this.elem.focus();
			},

			setShown: function (shown)
			{
				if (shown)
					this.show();
				else
					this.hide();
			},

			hide: function ()
			{
				this.setAttr('domTools_previous_display', this.getStyle('display'));
				this.setStyle('display', 'none');
				return this;
			},

			show: function ()
			{
				var previous = this.getAttr('domTools_previous_display');
				if (previous != null && previous != '' && previous != 'none')
					this.setStyle('display', previous);
				else
					this.removeStyle('display');
				return this;
			},

			/** Hide/how */
			toggle: function ()
			{
				if (this.getStyle('display') == 'none')
					this.show();
				else
					this.hide();
				return this;
			},

			/** Cette fonction ne supporte pas l'animation de shorthand CSS
			  * 	e.g. ne pas animer 'padding', mais animer 'padding-left', etc.
			  * Pour animer des couleurs, utiliser le format #00000 ou rgb(a), �viter les noms comme "black".
			  * Le style � animer doit obligatoirement avoir une valeur initiale d�j� assign�e � l'�l�ment anim�.
			  *
			  * elem.animate({
			  * 	properties: { opacity: 0.0 },
			  * 	durationMilli: 500,
			  * 	onCompleteCallback: function () { console.log('Complete'); }
			  * })
			  *
			  * @param {Dictionary} properties - Propri�t�s CSS ou HTML � animer, avec la valeur cible. Ces propri�t�s doivent avoir une valeur initiale avant d'appeler animate.
			  * @param {String} inteprolation - "swing" ou "linear"
			  * @param {Function} onCompleteCallback - Fonction callback appel�e lorsque l'animation est finie
			  * @param {Function} onStepCallback - Fonction callback appel�e � chaque frame de l'animation
			  * @param {Dictionary} extensionProperties - Pour animer des propri�t�s qui ne sont pas support�es "nativement" par cette m�thode
			  */
			animate: function (options)
			{
				if (options == null)
					options = {};

				var cssProps = options.properties;

				var durationMilli = options.durationMilli;
				if (durationMilli == null) durationMilli = 400;

				var interpolation = options.interpolation;
				if (interpolation == null) interpolation = 'swing';

				var onCompleteCallback = options.onCompleteCallback;
				var onStepCallback = options.onStepCallback;
				var extensionProperties = options.extensionProperties;

				var specialProperties = {};

				// TODO: d'autres propri�t�s sp�ciales � animer?
				if (this.elem == window)
				{
					specialProperties['scrollTop'] = {
						'get': function () { return dom.browserWindow.getScrollTop(); },
						'set': function (val, elem) { dom.browserWindow.setScrollTop(val); }
					};
					specialProperties['scrollLeft'] = {
						'get': function () { return dom.browserWindow.getScrollLeft(); },
						'set': function (val, elem) { dom.browserWindow.setScrollLeft(val); }
					};
				}
				else
				{
					var self = this;
					specialProperties['scrollTop'] = {
						'get': function () { return self.getScrollTop(); },
						'set': function (val) { self.setScrollTop(val); }
					};
					specialProperties['scrollLeft'] = {
						'get': function () { return self.getScrollLeft(); },
						'set': function (val) { self.setScrollLeft(val); }
					};
				};

				if (extensionProperties != null)
				{
					for (var extKey in extensionProperties)
					{
						specialProperties[extKey] = extensionProperties[extKey];
					}
				}

				var workList = [];

				var regex = /^(-?\d+(?:\.\d+)?)([a-zA-Z]*|%)$/g; // pour matcher des valeurs CSS, comme "10px" ou "30%"
				for (var key in cssProps)
				{
					var val = null;
					if (specialProperties[key] != null)
					{
						val = specialProperties[key].get();
					}
					else
					{
						val = this.getOwnStyle(key);
						if (val == null || val == '')
							val = this._getComputedStyle(key);
					}
					if (val === null || val === '')
						throw new Error("No CSS val :" + key); // Les propri�t�s � animer doivent avoir une valeur

					if (val.indexOf && (val.indexOf('#') == 0 || val.indexOf('rgb(') == 0 || val.indexOf('rgba(') == 0))
					{
						var color = dom.util.parseColor(val);
						var destColor = dom.util.parseColor(cssProps[key]);
						if (color != null && destColor != null)
						{
							workList.push({
								css: key,
								init: color,
								delta: [
									destColor[0] - color[0],
									destColor[1] - color[1],
									destColor[2] - color[2],
									destColor[3] - color[3]
								],
								unit: (dom.util.supportsRGBA() ? 'rgba' : 'rgb')
							});
							continue;
						}
					}

					regex.lastIndex = 0;
					var matches = regex.exec(val);
					if (matches == null)
						throw new Error("Bad CSS val " + key + " : " + val);

					var number = parseFloat(matches[1]);
					if (isNaN(number))
						throw new Error("Bad CSS val " + key + " : " + val);
					var unit = matches[2];

					var targetNumber = cssProps[key];

					if (typeof cssProps[key] == 'string')
					{
						regex.lastIndex = 0;
						matches = regex.exec(cssProps[key]);
						if (matches == null)
							throw new Error("Bad CSS val " + key + " : " + cssProps[key]);
						targetNumber = parseFloat(matches[1]);
						if (isNaN(targetNumber))
							throw new Error("Invalid target CSS " + key + " : " + cssProps[key]);
						if (unit != matches[2])
							throw new Error("Cannot animate CSS " + key + " from " + unit + " to " + matches[2]);
					}

					workList.push({
						css: key,
						init: number,
						delta: targetNumber - number,
						unit: unit
					});
				}

				var initialTimestamp = dom.util.getTimeStampForAnimation();
				var currTimestamp = initialTimestamp;

				var IPO_TYPE_LINEAR = 0;
				var IPO_TYPE_SWING = 1;
				var ipoType;

				if (interpolation == 'linear')
					ipoType = IPO_TYPE_LINEAR;
				else if (interpolation == 'swing')
					ipoType = IPO_TYPE_SWING;
				else
					throw new Error("Invalid interpolation " + interpolation);

				var self = this;
				var stepAnimation = function ()
				{
					currTimestamp = dom.util.getTimeStampForAnimation();
					var delta = (currTimestamp - initialTimestamp) / durationMilli;
					if (delta > 1.0) delta = 1.0;

					if (ipoType == IPO_TYPE_SWING)
						delta = Math.sin((delta - 0.5) * Math.PI) / 2 + 0.5;

					for (var i = 0; i < workList.length; i++)
					{
						var wlItem = workList[i];
						var value;
						if (wlItem.unit == 'rgba')
						{
							var value = 'rgba(' +
								((wlItem.init[0] + wlItem.delta[0] * delta) | 0) + ',' +
								((wlItem.init[1] + wlItem.delta[1] * delta) | 0) + ',' +
								((wlItem.init[2] + wlItem.delta[2] * delta) | 0) + ',' +
								(wlItem.init[3] + wlItem.delta[3] * delta) + ')';
						}
						else if (wlItem.unit == 'rgb')
						{
							var value = 'rgb(' +
								((wlItem.init[0] + wlItem.delta[0] * delta) | 0) + ',' +
								((wlItem.init[1] + wlItem.delta[1] * delta) | 0) + ',' +
								((wlItem.init[2] + wlItem.delta[2] * delta) | 0) + ')';
						}
						else
						{
							value = (wlItem.init + wlItem.delta * delta) + wlItem.unit;
						}

						if (specialProperties[wlItem.css] != null)
							specialProperties[wlItem.css].set(value, self);
						else
							self.setStyle(wlItem.css, value);
					}

					if (delta < 1.0)
					{
						if (window.requestAnimationFrame)
							window.requestAnimationFrame(stepAnimation);
						else
							setTimeout(stepAnimation, 1);

						if (onStepCallback != null)
							onStepCallback();
					}
					else if (onCompleteCallback != null)
					{
						onCompleteCallback();
					}
				};

				if (window.requestAnimationFrame)
					window.requestAnimationFrame(stepAnimation);
				else
					setTimeout(stepAnimation, 1);
			},

			/** Cas sp�cial de "animate" pour faire apparaitre un �l�ment par fade-in */
			fadeIn: function (durationMilli, interpolation, onComplete)
			{
				if (durationMilli == null)
					durationMilli = 500;

				var self = this;
				this.setStyle('opacity', '0.0');

				if (this.getStyle('display') == 'none')
					this.removeStyle('display');

				this.animate({
					properties: { 'opacity': 1.0 },
					durationMilli: durationMilli,
					interpolation: interpolation,
					onCompleteCallback: function ()
					{
						self.removeStyle('opacity');
						if (onComplete) onComplete();
					}
				});
				return this;
			},

			/** Cas sp�cial de "animate" pour faire disparaitre un �l�ment par fade-out */
			fadeOut: function (durationMilli, interpolation, onComplete)
			{
				if (durationMilli == null)
					durationMilli = 500;

				var self = this;
				this.setStyle('opacity', '1.0');
				this.animate({
					properties: { 'opacity': 0.0 },
					durationMilli: durationMilli,
					interpolation: interpolation,
					onCompleteCallback: function ()
					{
						self.setStyle('display', 'none').removeStyle('opacity');
						if (onComplete) onComplete();
					}
				});
				return this;
			},

			/** Cas sp�cial de "animate" pour faire apparaitre ou disparaitre un �l�ment par fade-in ou fade-out, selon l'�tat actuel de l'�l�ment */
			fadeToggle: function ()
			{
				if (this.getStyle('display') != 'none')
					this.fadeOut();
				else
					this.fadeIn();
				return this;
			},

			/** Cas sp�cial de "animate" pour faire apparaitre un �l�ment en animant sa hauteur */
			slideDown: function (durationMilli, interpolation)
			{
				if (durationMilli == null) durationMilli = 500;
				var h = this.getStyle('height');
				if (h == 'auto')
				{
					this.setStyle('visibility', 'hidden');
					if (this.getStyle('display') == 'none')
						this.removeStyle('display');
					h = this.getHeight() - parseInt(this.getStyle('padding-top')) - parseInt(this.getStyle('padding-bottom')) -
						parseInt(this.getStyle('border-top-width')) - parseInt(this.getStyle('border-bottom-width'));
				}
				this.setStyle('height', '0px').setStyle('visibility', 'visible');
				var initialHeight = parseInt(h);
				this.elem.style.height = '0px';
				this.setStyle('overflow', 'hidden');
				if (this.getStyle('display') == 'none')
					this.removeStyle('display');
				var paddingTopBefore = this.getStyle('padding-top');
				var paddingBottomBefore = this.getStyle('padding-bottom');
				this.setStyle('padding-top', '0px').setStyle('padding-bottom', '0px');
				this.animate({
					properties: { height: initialHeight, 'padding-top': paddingTopBefore, 'padding-bottom': paddingBottomBefore },
					durationMilli: durationMilli,
					interpolation: interpolation
				});
				return this;
			},

			/** Cas sp�cial de "animate" pour faire disparaitre un �l�ment en animant sa hauteur */
			slideUp: function (durationMilli, interpolation)
			{
				if (durationMilli == null) durationMilli = 500;
				var paddingTopBefore = this.getStyle('padding-top');
				var paddingBottomBefore = this.getStyle('padding-bottom');
				var initialHeight = (this.elem.offsetHeight - parseInt(paddingTopBefore) - parseInt(paddingBottomBefore)) -
					parseInt(this.getStyle('border-top-width')) - parseInt(this.getStyle('border-bottom-width'));
				this.elem.style.height = initialHeight + 'px';
				this.elem.style.overflow = 'hidden';
				var self = this;
				this.animate({
					properties: { height: 0, 'padding-top': 0, 'padding-bottom': 0 },
					durationMilli: durationMilli,
					interpolation: interpolation,
					onCompleteCallback: function ()
					{
						self.elem.style.display = 'none';
						self.setStyle('padding-top', paddingTopBefore)
							.setStyle('padding-bottom', paddingBottomBefore)
							.setStyle('height', initialHeight + 'px');
					}
				});
				return this;
			},

			/** Cas sp�cial de "animate" pour faire apparaitre ou disparaitre un �l�ment en animant sa hauteur, selon son �tat courant */
			slideToggle: function ()
			{
				if (this.getStyle('display') != 'none')
					this.slideUp();
				else
					this.slideDown();
				return this;
			},

			/** Cas sp�cial de "animate" pour faire apparaitre un �l�ment en animant son "zoom" */
			scaleUp: function (durationMilli, fromScale, toScale)
			{
				if (durationMilli == null)
					durationMilli = 500;
				if (fromScale == null)
					fromScale = 0;
				if (toScale == null)
					toScale = 1;

				var self = this;
				this.setStyle('transform', 'scale(' + fromScale + ')').show();
				this.animate({
					properties: { 'transform_scale': toScale },
					durationMilli: durationMilli,
					onCompleteCallback: function () { self.removeStyle('transform'); },
					extensionProperties: {
						'transform_scale': {
							'get': function () { return fromScale; },
							'set': function (val, elem) { elem.setStyle('transform', 'scale(' + val + ')'); }
						}
					}
				})
				return this;
			},

			/** Cas sp�cial de "animate" pour faire disparaitre un �l�ment en animant son "zoom" */
			scaleDown: function (durationMilli, fromScale, toScale)
			{
				if (durationMilli == null)
					durationMilli = 500;
				if (fromScale == null)
					fromScale = 1;
				if (toScale == null)
					toScale = 0;
				var self = this;
				this.setStyle('transform', 'scale(' + fromScale + ')');
				this.animate({
					properties: { 'transform_scale': toScale },
					durationMilli: durationMilli,
					onCompleteCallback: function () { self.removeStyle('transform'); self.hide(); },
					extensionProperties: {
						'transform_scale': {
							'get': function () { return fromScale; },
							'set': function (val, elem) { elem.setStyle('transform', 'scale(' + val + ')'); }
						}
					}
				});
				return this;
			}
		};

	// ----------------------- Classe dom.OfsysDomElemArray -----------------------
	/** Cette classe est retourn� par les m�thodes qui s�lectionnent 0..n �lements, comme "$$.selectAll", et fait des op�rations de "batch" uniquement */
	function OfsysDomElemArray(elems)
	{
		this.elems = elems;
	}
	dom.OfsysDomElemArray = OfsysDomElemArray;

	OfsysDomElemArray.prototype =
		{
			get: function (index)
			{
				if (this.elems[index] == null) throw new Error("No element at index : " + index);
				return new dom.Elem(this.elems[index]);
			},

			first: function ()
			{
				if (this.elems.length == 0) throw new Error("Empty");
				return new dom.Elem(this.elems[0]);
			},

			last: function ()
			{
				if (this.elems.length == 0) throw new Error("Empty");
				return new dom.Elem(this.elems[this.elems.length - 1]);
			},

			length: function ()
			{
				return this.elems.length;
			},

			addClass: function (className)
			{
				for (var i = 0; i < this.elems.length; i++) dom.wrap(this.elems[i]).addClass(className);
				return this;
			},

			removeClass: function (className)
			{
				for (var i = 0; i < this.elems.length; i++) dom.wrap(this.elems[i]).removeClass(className);
				return this;
			},

			setAttr: function (name, value)
			{
				for (var i = 0; i < this.elems.length; i++) dom.wrap(this.elems[i]).setAttr(name, value);
				return this;
			},

			removeAttr: function (name)
			{
				for (var i = 0; i < this.elems.length; i++) dom.wrap(this.elems[i]).removeAttr(name);
				return this;
			},

			setStyle: function (name, value)
			{
				for (var i = 0; i < this.elems.length; i++) dom.wrap(this.elems[i]).setStyle(name, value);
				return this;
			},

			removeStyle: function (name)
			{
				for (var i = 0; i < this.elems.length; i++) dom.wrap(this.elems[i]).removeStyle(name);
				return this;
			},

			setProp: function (name, value)
			{
				for (var i = 0; i < this.elems.length; i++) dom.wrap(this.elems[i]).setProp(name, value);
				return this;
			},

			setVal: function (newValue)
			{
				for (var i = 0; i < this.elems.length; i++) dom.wrap(this.elems[i]).setVal(newValue);
				return this;
			},

			remove: function ()
			{
				for (var i = 0; i < this.elems.length; i++) dom.wrap(this.elems[i]).remove();
				return this;
			},

			empty: function ()
			{
				for (var i = 0; i < this.elems.length; i++) dom.wrap(this.elems[i]).empty();
				return this;
			},

			setText: function (text)
			{
				for (var i = 0; i < this.elems.length; i++) dom.wrap(this.elems[i]).setText(text);
				return this;
			},

			setInnerHTML: function (value)
			{
				for (var i = 0; i < this.elems.length; i++) dom.wrap(this.elems[i]).setInnerHTML(value);
				return this;
			},

			setOuterHTML: function (value)
			{
				for (var i = 0; i < this.elems.length; i++) dom.wrap(this.elems[i]).setOuterHTML(value);
				return this;
			},

			appendText: function (text)
			{
				for (var i = 0; i < this.elems.length; i++) dom.wrap(this.elems[i]).appendText(text);
				return this;
			},

			appendHTML: function (html)
			{
				for (var i = 0; i < this.elems.length; i++) dom.wrap(this.elems[i]).appendHTML(html);
				return this;
			},

			on: function (eventType, arg1, arg2)
			{
				for (var i = 0; i < this.elems.length; i++) dom.wrap(this.elems[i]).on(eventType, arg1, arg2);
				return this;
			},

			trigger: function (eventName)
			{
				for (var i = 0; i < this.elems.length; i++) dom.wrap(this.elems[i]).trigger(eventName);
				return this;
			},

			setScrollLeft: function (newScroll)
			{
				for (var i = 0; i < this.elems.length; i++) dom.wrap(this.elems[i]).setScrollLeft(newScroll);
				return this;
			},

			setScrollTop: function (newScroll)
			{
				for (var i = 0; i < this.elems.length; i++) dom.wrap(this.elems[i]).setScrollTop(newScroll);
				return this;
			},

			hide: function ()
			{
				for (var i = 0; i < this.elems.length; i++) dom.wrap(this.elems[i]).hide();
				return this;
			},

			show: function ()
			{
				for (var i = 0; i < this.elems.length; i++) dom.wrap(this.elems[i]).show();
				return this;
			},

			toggle: function ()
			{
				for (var i = 0; i < this.elems.length; i++) dom.wrap(this.elems[i]).toggle();
				return this;
			}
		};

	// ----------------------- dom.util -----------------------

	dom.util = {};

	/** Convertit des noms CSS du format "border-top-width" au format "borderTopWidth", surtout utile sur vieux IE */
	dom.util.cssToCamelCase = function (text)
	{
		return text.replace(/-+(.)?/g, function (match, chr)
		{
			return chr ? chr.toUpperCase() : '';
		});
	};

	dom.util.supportsRGBA = function ()
	{
		var scriptElement = dom.create('script');
		try 
		{
			scriptElement.elem.style.color = 'rgba(0, 0, 0, 0.5)';
		}
		catch (e) 
		{
			return false;
		}
		return true;
	};

	/** Indique si le navigateur supporte la propri�t� CSS3 "transform" */
	dom.util.supportsTransform = function ()
	{
		var e = dom.create('div');
		return ('transform' in e.elem.style);
	};

	/** Retourne un timestamp relatif le plus pr�cis possible (ne repr�sente aucun temps absolu, sert � mesurer le temps �coul�
	 * entre deux appels en prenant la diff�rence)
	 */
	dom.util.getTimeStampForAnimation = function ()
	{
		// getTimeStampForAnimation, on prend le timer le plus pr�cis offert par le browser
		if (window.performance && window.performance.now)
			return window.performance.now();
		else if (window.performance && window.performance.webkitNow)
			return window.performance.webkitNow();
		else
			return new Date().getTime();
	};

	dom.util.parseColor = function (color, fallbackValue)
	{
		color = ofsys.util.string.trim(color).toLowerCase();
		//color = _colorsByName[color] || color;
		var hex3 = color.match(/^#([0-9a-f]{3})$/i);
		if (hex3) 
		{
			hex3 = hex3[1];
			return [
				parseInt(hex3.charAt(0), 16) * 0x11,
				parseInt(hex3.charAt(1), 16) * 0x11,
				parseInt(hex3.charAt(2), 16) * 0x11, 1
			];
		}
		var hex6 = color.match(/^#([0-9a-f]{6})$/i);
		if (hex6) 
		{
			hex6 = hex6[1];
			return [
				parseInt(hex6.substr(0, 2), 16),
				parseInt(hex6.substr(2, 2), 16),
				parseInt(hex6.substr(4, 2), 16),
				1
			];
		}
		var rgba = color.match(/^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+.*\d*)\s*\)$/i) || color.match(/^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
		if (rgba)
			return [parseInt(rgba[1]), parseInt(rgba[2]), parseInt(rgba[3]), rgba[4] === undefined ? 1 : parseFloat(rgba[4])];

		var rgb = color.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
		if (rgb)
			return [parseInt(rgb[1]), parseInt(rgb[2]), parseInt(rgb[3]), 1];

		return fallbackValue;
	}

	/** Annule/bloque un �v�nement */
	dom.util.cancelEvent = function (evt)
	{
		if (evt.preventDefault)
			evt.preventDefault();
		if (evt.stopPropagation)
			evt.stopPropagation();

		if (ofsys.util.isIE8OrOlder())
		{
			evt.cancelBubble = true; // IE8
			evt.returnValue = false; // IE8
		}
	};

	/** Sur browsers modernes, on a l'�v�nement 'oninput' sur les textbox qui permet de savoir quand le contenu a
	  * a chang�. Cet event n'existe pas sur IE8, et fonctionne mal sur IE9. Cette fonction permet de contourner
	  * les bugs des vieux IE et d'avoir un comportement uniforme partout
	  */
	dom.util._onInputEventCompatibility = function (input, callback)
	{
		if ('onpropertychange' in input.elem) // IE 8-9
		{
			input.elem.onpropertychange = callback;
		}

		input.on('keyup', { input: input }, callback);
	};

	/** Pour IE < 10, rendre un �l�ment et ses enfants non s�lectionnables. 
	 * Pour les browsers modernes, l� o� support�, pr�f�rer l'utilisation de CSS pour rendre des �l�ments non selectionnables 
	 */
	dom.util.makeUnselectable = function (node)
	{
		if (ofsys.util.isIE9OrOlder())
		{
			if (node.tagName == null)
				return;
			var tagName = node.tagName.toLowerCase();
			if (tagName != "input" && tagName != "select" && tagName != "textarea")
			{
				if (node.nodeType == 1)
				{
					node.setAttribute("unselectable", "on");
				}
				var child = node.firstChild;
				while (child)
				{
					dom.util.makeUnselectable(child);
					child = child.nextSibling;
				}
			}
		}
	};

	dom.util.selectNothing = function ()
	{
		if (window.getSelection)
		{
			if (window.getSelection().empty)  // Chrome
			{
				window.getSelection().empty();
			}
			else if (window.getSelection().removeAllRanges)  // Firefox
			{
				window.getSelection().removeAllRanges();
			}
		}
		else if (document.selection)  // IE
		{
			try
			{
				document.selection.empty();
			}
			catch (e)
			{
				// IE frequently throws "Unknown runtime error" when doing this. Since the error is unknown
				// I can't do much better than shut it up...
			}
		}
	};

	/** S�lectionne un �l�ment par son ID */
	dom.id = function (id) { return dom._selectByID(id, document); };

	/** S�lectionne le body */
	dom.body = function () { return dom.wrap(document.body); };

	/** S�lectionne un �l�ment par s�lecteur CSS */
	dom.select1 = function (selector) { return dom._select1(selector, document); };

	/** S�lectionne 0..n �l�ments par s�lecteur CSS */
	dom.selectAll = function (selector) { return dom._selectAll(selector, document); };

	/** S�lectionne 0..n �l�ments par classe CSS */
	dom.selectAllByClass = function (className) { return dom._selectAllByClass(className, document); };

	/** Cr�e un nouvel �l�ment de DOM, e.g. $$.create('div', { 'id': 'monDiv' }) */
	dom.create = function (nodeType, attr)
	{
		var elem = document.createElement(nodeType);
		var domObj = new dom.Elem(elem);
		if (attr != null)
		{
			for (var key in attr) 
			{
				if (key != 'style' || (key == 'style' && key.toUpperCase != null /* est une string */))
					elem.setAttribute(key, attr[key]);
			}

			if (attr['style'] != null && attr['style'].toUpperCase == null /* n'est pas une string */)
			{
				var styles = attr['style'];
				for (var key in styles)
					domObj.setStyle(key, styles[key]);
			}
		}
		return domObj;
	};

	/** Cr�e un nouvel �l�ment de DOM dans un namespace */
	dom.nsCreate = function (namespace, nodeType, attr)
	{
		if (document.createElementNS == null)
		{
			throw new Error("Namespaces not supported by browser");
			return;
		}

		var elem = document.createElementNS(namespace, nodeType);
		var domObj = new dom.Elem(elem);
		if (attr != null)
		{
			for (var key in attr) 
			{
				if (key != 'style' || (key == 'style' && key.toUpperCase != null /* est une string */))
					elem.setAttribute(key, attr[key]);
			}

			if (attr['style'] != null && attr['style'].toUpperCase == null /* n'est pas une string */)
			{
				var styles = attr['style'];
				for (var key in styles)
					domObj.setStyle(key, styles[key]);
			}
		}
		return domObj;
	};

	/** Cr�e un objet dom.Elem � partir d'une string contenant un fragment de HTML.
	* Ce fragment de HTML doit contenir un seul �l�ment � la race.
	*/
	dom.parse = function (html)
	{
		var temp = document.createElement('div');
		temp.innerHTML = html;
		if (temp.childNodes.length > 1)
			throw new Error("Multiple nodes in html fragment");
		return new dom.Elem(temp.firstChild);
	};

	/** Cr�e un dom.Elem � partir d'un objet DOM arbitraire */
	dom.wrap = function (elem) { return new dom.Elem(elem); };

	var _isWindowLoaded = false;

	/** Le callback "load" est appel� quand tout est charg� : HTML, images, CSS, scripts. */
	dom.onLoad = function (callback)
	{
		if (_isWindowLoaded)
		{
			callback();
		}
		else
		{
			if (window.addEventListener)
				window.addEventListener('load', callback, false);
			else if (window.attachEvent) // IE8
				window.attachEvent('onload', callback);
			else
				throw new Error("Not supported");
		}
	}

	if (window.addEventListener)
		window.addEventListener('load', function () { _isWindowLoaded = true; }, false);
	else if (window.attachEvent) // IE8
		window.attachEvent('onload', function () { _isWindowLoaded = true; });
	else
		throw new Error("Unsupported");

	/** Le callback "ready" est appel� quand tout le HTML est charg�, mais sans attendre les images, le CSS, le javascript async */
	dom.onReady = function (callback)
	{
		if (document.readyState == 'complete' || document.readyState == 'interactive')
		{
			// document already ready
			callback();
		}
		else
		{
			if (document.addEventListener)
			{
				document.addEventListener('DOMContentLoaded', callback, false);
			}
			else if (document.attachEvent) // IE8
			{
				document.attachEvent("onreadystatechange", function ()
				{
					if (document.readyState === "complete")
						callback();
				});
			}
			else
			{
				throw new Error("Not supported");
			}
		}
	};

	/** Enregistre un callback � un �v�nement 
	* 2 signatures possibles :
	* on(elem, string eventType, Function callback)
	* on(elem, string eventType, Dicitonary data, Function callback)
	*/
	dom.on = function (elem, eventType, arg1, arg2)
	{
		var callback;
		var data;
		var fn;

		if (arg2 == null)
		{
			fn = callback = arg1;
		}
		else
		{
			data = arg1;
			callback = arg2;
			fn = function (event) { callback(event, data); };
		}

		// Workarounds pour patcher certains events sur vieux browsers
		if (eventType == 'input' && (!('oninput' in elem) || ofsys.util.isIE9OrOlder()))
		{
			// onInput n'est pas disponible sur IE8, et fonctionne mal sur IE9
			// TODO: ce workaround va retourner null et l'�v�nement ne pourra pas �tre retir�
			return dom.util._onInputEventCompatibility(dom.wrap(elem), fn);
		}

		if (arg2 == null)
		{
			if (elem.addEventListener)
				elem.addEventListener(eventType, callback, false);
			else if (elem.attachEvent)
				elem.attachEvent('on' + eventType, callback); // IE8
			else
				throw new Error("Unsupported");
		}
		else
		{
			if (elem.addEventListener)
				elem.addEventListener(eventType, fn, false);
			else if (elem.attachEvent)
				elem.attachEvent('on' + eventType, fn); // IE8
			else
				throw new Error("Unsupported");
		}

		return { eventType: eventType, fn: fn };
	};

	dom._selectAll = function (selector, parent)
	{
		var elems = parent.querySelectorAll(selector);
		return new dom.OfsysDomElemArray(ofsys.util.convertToArray(elems, 0));
	};
	dom._selectAllByClass = function (className, parent)
	{
		var elems;
		if (parent.getElementsByClassName)
			elems = parent.getElementsByClassName(className);
		else if (parent.querySelectorAll)
			elems = parent.querySelectorAll('.' + className); // IE8
		else
			throw new Error("Unsupported");
		return new dom.OfsysDomElemArray(ofsys.util.convertToArray(elems, 0));
	};
	dom._select1 = function (selector, parent)
	{
		var elems = parent.querySelectorAll(selector);
		if (elems.length == 1)
			return new dom.Elem(elems[0]);
		else if (elems.length == 0)
			throw new Error('Element(s) not found : ' + selector);
		else
			throw new Error('Too many element(s) found for ' + selector + ' : ' + elems.length);
	};
	dom._selectByID = function (id, parent)
	{
		if ('getElementById' in parent)
		{
			var elem = parent.getElementById(id);
			if (elem == null)
				throw new Error('Element not found : ' + id);
			return new dom.Elem(elem);
		}
		else
		{
			var elem = parent.querySelector('#' + id);
			if (elem == null)
				throw new Error('Element not found : ' + id);
			return new dom.Elem(elem);
		}
	};

	// ----------------------- dom.svg -----------------------

	dom.svg =
		{
			create: function (nodeType, attr) { return dom.nsCreate("http://www.w3.org/2000/svg", nodeType, attr); }
		};

	// ----------------------- dom.browserWindow -----------------------

	dom.browserWindow =
		{
			getSize: function ()
			{
				var width = 1080; var height = 800;
				if (window.innerHeight)
				{
					width = window.innerWidth;
					height = window.innerHeight;
				}
				else if (window.document.documentElement.clientHeight)
				{
					width = window.document.documentElement.clientWidth;
					height = window.document.documentElement.clientHeight;
				}
				else if (window.document.body.clientHeight)
				{
					width = window.document.body.clientWidth;
					height = window.document.body.clientHeight;
				}

				return { width: width, height: height };
			},
			getScrollTop: function ()
			{
				if (window.pageYOffset !== undefined)
				{
					return window.pageYOffset;
				}
				else
				{
					// IE8
					var isCSS1Compat = ((document.compatMode || "") === "CSS1Compat");
					return (isCSS1Compat ? document.documentElement.scrollTop : document.body.scrollTop);
				}
			},
			setScrollTop: function (scroll) 
			{
				window.scrollTo(dom.browserWindow.getScrollLeft(), scroll);
			},
			getScrollLeft: function ()
			{
				if (window.pageXOffset !== undefined)
				{
					return window.pageXOffset;
				}
				else
				{
					// IE8
					var isCSS1Compat = ((document.compatMode || "") === "CSS1Compat");
					return (isCSS1Compat ? document.documentElement.scrollLeft : document.body.scrollLeft);
				}
			},
			setScrollLeft: function (scroll) 
			{
				window.scrollTo(scroll, dom.browserWindow.getScrollTop());
			},
			getScrollWidth: function () { return document.body.scrollWidth; },
			getScrollHeight: function () { return document.body.scrollHeight; },
		};

})(window['DI'].dom);


// NOTE IMPORTANTE: ce fichier n'est pas pr�vu pour �tre utilis� seul. Il est pr�vu pour �tre inclus dans un package minifi�
// Voir /tests/jfcad/WebPushPackage.aspx

// pseudo-namespaces
if (window['DI'] == null) window['DI'] = {};
if (window['DI'].WebPush == null) window['DI'].WebPush = {};

(function (push) // pseudo-namspace
{
	"use strict";

	var config = '{
				apiKey: 'AIzaSyDhT3n_qnl8xoxAlbGqb2n2VRwjwcBJVE0',
                authDomain: 'demodi-8272d.firebaseapp.com',
                databaseURL: 'https://demodi-8272d.firebaseio.com',
                projectId: 'demodi-8272d',
                storageBucket: 'demodi-8272d.appspot.com',
                messagingSenderId: '165900517247'
            }';
	var applicationKey = '6021:C9gAcGRYg2FF8ca46Hl4MVcPRzHxogPO';
	var strBrowserTypes = '{"Unknown":0,"Chrome":4,"Firefox":8}';
	var g_debug = false;

	firebase.initializeApp(config);
	var messaging = firebase.messaging();

	messaging.onTokenRefresh(function () 
	{
		messaging.getToken()
			.then(function (refreshedToken)
			{
				setTokenSentToServer(false);
				sendTokenToServer(refreshedToken);
			})
			.catch(function (err) 
			{
				if (g_debug === true)
					console.log('Unable to retrieve refreshed token', err);
			});
	});

	messaging.onMessage(function (payload) 
	{
		if (g_debug === true)
			console.log("onMessage :Message received. ", payload);

		showNotification(payload);
	});

	function showNotification(payload) 
	{
		if (!Notification || Notification.permission !== "granted" || document.hidden)
			return;

		navigator.serviceWorker.getRegistration('/firebase-cloud-messaging-push-scope').then(function (serviceWorker) 
		{
			serviceWorker.active.postMessage({ "showNotification": payload });
		}).catch(function (exception)
		{
			if (g_debug === true)
				console.log(exception);
		});
	}

	function GetToken()
	{
		return window.localStorage.getItem('PushToken');
	}

	function Init()
	{
		tryIdentify();

		if (isTokenSentToServer() && IsIdentify() && !IsIdentitySent())
		{
			ResendToken();
		}

		g_debug = window.location.search.slice(1).split('&').indexOf('ofsysDebug=1') > -1;
	}
	push.Init = Init;

	function ResendToken()
	{
		var token = GetToken();
		if (token != null)
		{
			sendTokenToServer(token);
		}
	}

	function ResetIdentify()
	{
		SetIdentitySent(false);
		window.localStorage.removeItem('ContactIdentifier');

		if (g_debug === true)
			console.log("Identity reset");
	}
	push.ResetIdentify = ResetIdentify;

	function IsIdentify()
	{
		return window.localStorage.getItem('ContactIdentifier') !== null;
	}

	function IsIdentitySent()
	{
		var isIdentitySent = window.localStorage.getItem('IsIdentitySent');
		return isIdentitySent != null && isIdentitySent == "1";
	}

	function SetIdentitySent(value)
	{
		return window.localStorage.setItem('IsIdentitySent', value ? 1 : 0);
	}

	function tryIdentify()
	{
		if (IsIdentify())
			return;

		var dic = window['DI'].util.getURLParameters();
		if (typeof dic['oft_id'] !== 'undefined' && typeof dic['oft_k'] !== 'undefined')
		{
			var ContactIdentifier = { "id": dic['oft_id'], "key": dic['oft_k'], "identificationType": "sendlog" };
			window.localStorage.setItem('ContactIdentifier', JSON.stringify(ContactIdentifier));
		}
		else if (typeof dic['oft_c'] !== 'undefined' && typeof dic['oft_ck'] !== 'undefined')
		{
			var ContactIdentifier = { "id": dic['oft_c'], "key": dic['oft_ck'], "identificationType": "contact" };
			window.localStorage.setItem('ContactIdentifier', JSON.stringify(ContactIdentifier));
		}
	}

	//Prend une suite de params ex : Identify("f_email", "abc@test.com", "f_id",  123)
	//ou un obj json ex : Identify({"f_email": "abc@test.com", "f_id" : 123})
	//ou un arary ex : Identify(["f_email", "abc@test.com", "f_id",  123])
	function Identify()
	{
		if (!IsIdentify())
		{
			var testJSON = {};
			var testArray = [];
			var dic = {};
			if (arguments.length === 1 && arguments[0].constructor === testJSON.constructor)
			{
				for (var key in arguments[0])
				{
					dic[key] = arguments[0][key];
				}
			}
			else if (arguments.length === 1 && arguments[0].constructor === testArray.constructor && arguments[0].length % 2 === 0)
			{
				for (var i = 0; i < arguments[0].length; i++)
				{
					if (i % 2 === 0)
					{
						var key = arguments[0][i];
						if (typeof key === 'string' && key.indexOf("f_") === 0)
							dic[key] = arguments[0][i + 1];
					}
				}
			}
			else if (arguments.length > 0 && arguments.length % 2 === 0)
			{
				for (var i = 0; i < arguments.length; i++)
				{
					if (i % 2 === 0)
					{
						var key = arguments[i];
						if (typeof key === 'string' && key.indexOf("f_") === 0)
							dic[key] = arguments[i + 1];
					}
				}
			}
			else
			{
				throw "invalid parameters";
			}

			var ContactIdentifier = { "keys": dic, "identificationType": "project" };
			window.localStorage.setItem('ContactIdentifier', JSON.stringify(ContactIdentifier));

			if (g_debug === true)
				console.log('Contact identified');
		}
		else
		{
			if (g_debug === true)
				console.log('Contact already identified, ' + window.localStorage.getItem('ContactIdentifier'));
		}

		if (isTokenSentToServer() && !IsIdentitySent())
		{
			ResendToken();
		}
	}
	push.Identify = Identify;

	function sendTokenToServer(currentToken) 
	{
		if (typeof currentToken === 'undefined' || currentToken === null)
			return;

		var oldToken = window.localStorage.getItem('PushToken');

		if (!isTokenSentToServer() || (oldToken !== null && oldToken !== currentToken) || (IsIdentify() && !IsIdentitySent())) 
		{
			var ContactIdentifier = window.localStorage.getItem('ContactIdentifier');
			var ContactIdentificationType = null;
			var ContactIdentification = null;
			var fields = null;

			if (ContactIdentifier != null)
			{
				ContactIdentifier = JSON.parse(ContactIdentifier);
				ContactIdentificationType = ContactIdentifier.identificationType;

				if (ContactIdentificationType == 'contact' || ContactIdentificationType == 'sendlog')
				{
					ContactIdentification = ContactIdentifier.id + ':' + ContactIdentifier.key;
				}
				else if (ContactIdentificationType == 'project')
				{
					fields = ContactIdentifier.keys;
				}
			}

			var data = {
				"ApplicationId": applicationKey,
				"ContactIdentificationType": ContactIdentificationType,
				"ContactIdentification": ContactIdentification,
				"Fields": fields,
				"Token": currentToken,
				"Domain": location.host,
				"Language": (window.navigator.userLanguage || window.navigator.language).substring(0, 2),
				"idPlatformPush": getBrowserType(strBrowserTypes)
			};

			if (g_debug === true)
				console.log('Sending token to server with data: ', data);

			window['DI'].util.net.corsAjax({
				"url": 'https://lightspeed.dev.ofsys.com/webservices/ofc4/push.ashx?method=SetToken',
				"data": JSON.stringify(data),
				"success": function (responseText)
				{
					if (g_debug === true)
						console.log(responseText);

					setTokenSentToServer(true);
					SetIdentitySent(ContactIdentifier != null);
				},
				"error": function (status, responseText)
				{
					if (g_debug === true) 
					{
						console.log(status);
						console.log(responseText);
					}
				}
			});
		}
		else 
		{
			if (g_debug === true)
				console.log('Token already sent to server so won\'t send it again unless it changes');
		}

		window.localStorage.setItem('PushToken', currentToken);
	}

	function getBrowserType(browserTypes)
	{
		var regChrome = new RegExp('Chrome/[.0-9]*(\sMobile)?|CriOS');
		var regFirefox = new RegExp('Firefox/[.0-9]*$|FxiOS/');
		var userAgent = navigator.userAgent;

		var key;
		if (regChrome.test(userAgent))
			key = 'Chrome';
		else if (regFirefox.test(userAgent))
			key = 'Firefox';
		else
			key = 'Unknown';

		if (g_debug === true)
			console.log(userAgent + ' matched with ' + key);

		return browserTypes[key];
	}

	function isTokenSentToServer() 
	{
		return window.localStorage.getItem('sentToServer') == 1;
	}

	function setTokenSentToServer(sent) 
	{
		window.localStorage.setItem('sentToServer', sent ? 1 : 0);
	}

	function requestPermission() 
	{
		messaging.requestPermission()
			.then(function ()
			{
				messaging.getToken()
					.then(function (currentToken)
					{
						if (currentToken)
						{
							sendTokenToServer(currentToken);
						} else
						{
							if (g_debug === true)
								console.log('No Instance ID token available. Request permission to generate one.');

							setTokenSentToServer(false);
						}
					})
					.catch(function (err)
					{
						if (g_debug === true)
							console.log('An error occurred while retrieving token. ', err);

						showToken('Error retrieving Instance ID token. ', err);
						setTokenSentToServer(false);
					});
			})
			.catch(function (err)
			{
				if (g_debug === true)
					console.log('Unable to get permission to notify.', err);
			});
	}
	push.RequestPermission = requestPermission;

	function deleteToken() 
	{
		messaging.getToken()
			.then(function (currentToken) 
			{
				messaging.deleteToken(currentToken)
					.then(function ()
					{
						if (g_debug === true)
							console.log('Token deleted.');
						setTokenSentToServer(false);
					})
					.catch(function (err)
					{
						if (g_debug === true)
							console.log('Unable to delete token. ', err);
					});
			})
			.catch(function (err)
			{
				if (g_debug === true)
					console.log('Error retrieving Instance ID token. ', err);
			});
	}

	window.addEventListener('message', function (evt) 
	{
		if (g_debug === true)
		{
			console.log('message received');
			console.log(evt);
		}

		if (typeof evt === 'undefined' || evt == null)
			return;

		var objInput = evt;

		if (evt.constructor === ''.constructor)
		{
			try
			{
				objInput = JSON.parse(evt);
			}
			catch (e)
			{
				return;
			}
		}

		if (typeof objInput.data === 'undefined' || objInput.data == null)
			return;

		var strData = '' + objInput.data;
		if (strData.substr(0, 3) == 'di:')
		{
			var currentToken = GetToken();
			if (currentToken) 
			{
				evt.source.postMessage('di:' + JSON.stringify({ 'event': 'sendtoken', 'value': currentToken }), '*');
			}
			else 
			{
				evt.source.postMessage('di:' + JSON.stringify({ 'event': 'sendtoken', 'value': null }), '*');
			}
		}
	});
})(window['DI'].WebPush);

window['DI'].dom.onLoad(function ()
{
	window['DI'].WebPush.Init();
});
