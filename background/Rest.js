/*
	/me = Gets currently logged in user
	/supply-drop = Gets info about weekly supply drops, and also what rewards you've earned
	/user/feed/<id> = Remove item from feed
	/order/user/<userid>?filters%5Bactive%5D=true = Active unsent orders. All endpoint regardless of filter contain "counts". Ex: {"orders":[{"id":10197951,"orderDate":1530491504,"sentDate":null,"paymentMethod":{"id":21,"isPrepayment":true,"name":"Bitcoin"},"shippingMethod":{"id":1,"name":"Skicka som Brev \/ Postpaket - Express","price":0,"vat":0},"currency":"SEK","statusCode":1,"trackingNumber":null,"trackingUrl":null,"rows":[{"id":16378650,"unitVat":397.8,"quantity":1,"unitPrice":1989,"inStock":true,"product":{"id":284732,"name":"AMD Ryzen 5 2600","release":{"timestamp":1524103200,"format":"Y-m-d"},"thumbnail":"\/images\/product\/284732\/?w=62&trim"}},{"id":16378651,"unitVat":218,"quantity":1,"unitPrice":1090,"inStock":true,"product":{"id":275753,"name":"Seagate Intern h\u00e5rddisk Barracuda Compute HDD 4TB \/ 256MB \/ 5400 RPM \/ ST4000DM004","release":{"timestamp":1506484800,"format":"Y-m-d"},"thumbnail":"\/images\/product\/275753\/?w=62&trim"}},{"id":16378652,"unitVat":179,"quantity":1,"unitPrice":895,"inStock":true,"product":{"id":287903,"name":"Seagate Intern h\u00e5rddisk Barracuda Compute HDD 4TB \/256MB\/5400RPM\/ ST4000DM004 (Fyndvara - Klass 1)","release":{"timestamp":1506484800,"format":"Y-m-d"},"thumbnail":"\/images\/product\/287903\/?w=62&trim"}},{"id":16378653,"unitVat":398,"quantity":1,"unitPrice":1990,"inStock":true,"product":{"id":247809,"name":"Corsair Vengeance LED White 16GB (2x8GB) \/ 2666MHz \/ DDR4 \/ CL16 \/ CMU16GX4M2A2666C16","release":{"timestamp":1467691200,"format":"Y-m-d"},"thumbnail":"\/images\/product\/247809\/?w=62&trim"}},{"id":16378654,"unitVat":149.8,"quantity":1,"unitPrice":749,"inStock":true,"product":{"id":263671,"name":"Corsair PowerSupply (PSU) TX550 550W 80 Plus GOLD","release":{"timestamp":1488168000,"format":"Y-m-d"},"thumbnail":"\/images\/product\/263671\/?w=62&trim"}},{"id":16378655,"unitVat":138,"quantity":1,"unitPrice":690,"inStock":true,"product":{"id":267082,"name":"ASUS Prime A320M-K - mATX \/ A320","release":{"timestamp":1488430800,"format":"Y-m-d"},"thumbnail":"\/images\/product\/267082\/?w=62&trim"}}],"store":null,"productKeys":[],"shippingAddress":{"name":"Joakim Skogby","city":"HALLSTAHAMMAR","address":"Johan Forsells V\u00e4g 12","zipCode":"73440"},"userExperiencePointBoosts":[]}],"counts":{"active":1,"history":60,"service":0,"cancelled":2}}
	Status code 1 = received, 2 = processing, 3 = ready for pickup at store location, 4 = sent via post
	/order/user/<userid>?filters%5Bhistory%5D=true = Same as above but for history. These include postnord tracking
	/order/<id> = Get information about an order ID
*/

export default class Rest{

	constructor(endpoint, method){

		this.endpoint = endpoint;
		this.error = undefined;
		this.data = {};
		this.method = method || 'GET';
		return this.send();

	}

	send(){
		let th = this,
			url = "https://www.webhallen.com/api/"+this.endpoint,
			xmlhttp = new XMLHttpRequest()
		;

		return new Promise((res, rej) => {
			xmlhttp.onreadystatechange = function(){
				if(this.readyState == 4){
					if(this.status != 200){
						th.error = "Request failed, status was "+th.status;
						return rej(th);
					}
					try{
						th.data = JSON.parse(this.responseText); 
					}catch(err){
						th.error = "Invalid JSON in response, see log.";
						console.error("Improper JSON: ", this.responseText);
						return rej(th);
					}
					res(th);
				}
			};
			xmlhttp.open(this.method, url, true);
			xmlhttp.send();
		});

	}

}
