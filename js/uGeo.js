/*
	uGeo v1.0
	- evgeniev.dev@gmail.com
*/


function uGeo() {
	
	// World Data - Cities with Lat/Lon/Region/Country/Code
	this.wData = new Array();
	// List of Country names
	this.cList = new Array();
	this.LoadData();
	
	// User Geo Location
	this.uLocation = false;
 
	
}

uGeo.prototype.LoadData = function() {
	
	/*
		
		Data source : http://simplemaps.com/resources/world-cities-data
		
	*/
	
	console.time('Load WorldData');
	
	// Since the AJAX request goes into anonymous function, create reference to 'this' outside of it to allow access to root variables like wData
	var _this = this;
	
	var dFolder = "Data/"
	
	// AJAX request via jQuery
	var dataRequest = $.get( dFolder+"world_cities.txt" , function (data) { 
		
		console.time('Process WorldData');
		
		// Reset wData first
		_this.wData.length = 0;
		
		var Split = data.split("\n");
		
		// Loop through the loaded data and transform it into a JS Object
		// Skip the first row of the file since it is used to explain the data format only
		var Row;
		for( var r = 1; r < Split.length; r++ ) {
			
			Row = Split[ r ];
			Row = Row.split(",");
			
			_this.wData.push(
				Row
			);
			
			// Create a list of unique country names
			if( _this.cList.indexOf( Row[ 5 ] ) < 0 ) {
			
				_this.cList.push(
					
					Row[ 5 ]
					
				);
				
			}
			 	
		}
		
		console.timeEnd('Process WorldData');
		
	} , "text" ); 
	
	$.when( dataRequest ).done(function ( ) {
		
		console.timeEnd('Load WorldData');
	 
	});
	
};

 

uGeo.prototype.GeoDistance = function( lat1 , lon1 , lat2 , lon2 ) {
	
	/*
		
		This uses the ‘haversine’ formula to calculate the great-circle distance between two points 
		– that is, the shortest distance over the earth’s surface 
		
		
		Haversine formula:	
		
		a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
		c = 2 ⋅ atan2( √a, √(1−a) )
		d = R ⋅ c
		
		where	φ is latitude, λ is longitude, R is earth’s radius (mean radius = 6,371km);
		note that angles need to be in radians to pass to trig functions!
		
		Source : http://www.movable-type.co.uk/scripts/latlong.html
		
	*/
	 
	var R = 6371; // earth radius in km
	var Phi1 = this.toRadians( lat1 );
	var Phi2 = this.toRadians( lat2 );
	var dPhi = this.toRadians( lat2-lat1 );
	var dLam = this.toRadians( lon2-lon1 );

	var a = Math.sin(dPhi/2) * Math.sin(dPhi/2) +
			Math.cos(Phi1) * Math.cos(Phi2) *
			Math.sin(dLam/2) * Math.sin(dLam/2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

	var d = R * c;
 
	return d;	
	
};

uGeo.prototype.toRadians = function(Value) {
 
    return Value * Math.PI / 180;
};

uGeo.prototype.FindNearest = function( lat , lon , Quantity , MinimumDistance , CountryList ) {
 
	var Data = this.wData;
	var dLen = Data.length;
 
	// Exit function prematurely if WorldData list is empty
	if( dLen === 0 ) { 
		return false; 
	}
	
	console.time('FindNearest');
	
	// Quantity = how many of the nearest cities to return. 
	// If undefined, only the nearest city is returned, otherwise an array of top nearest cities is returned
	var MaxN = 1;
	if( Quantity !== undefined && Quantity === parseInt( Quantity , 10 ) && Quantity > 1 ) {
		MaxN = Quantity;
	}
	var Nearest = new Array( MaxN );
	
	// MinimumDistance - skip cities below this distance
	var minDist = 0;
	if( MinimumDistance !== undefined && MinimumDistance > 0 ) {
		minDist = MinimumDistance;
	}
	
	// CountryList - filter location lookup to these countries only
	var cList = [];
	if( CountryList !== undefined ){
		cList = ( CountryList.constructor === Array && CountryList.length > 0 ) ? CountryList : [];
	}
	
	// Format of each index in the Nearest array
	var NScheme = function( dIndex , Dist ) {
		
		return {
			dIndex: dIndex,
			Dist: Dist
		};
		
	};
 
	 
	// Establish the nearest n locations based on the user's lat/lon coordinates
	var Dist , dLat , dLon, Result = new Array();
	for( var i = 0; i < MaxN; i++ ) {
		
		// Add some arbitrary value (higher than any possible distance) to check the first index against
		Nearest[ i ] = NScheme( -1 , 100000 );
		
		if( i == 0 && MaxN > 1 ) {
			
			// Temporary array to hold geodistances (to avoid re-calculating the same thing if more than one cycle is needed)
			var dList = new Array( dLen );
			
		}
		
		for( var r = 0; r < dLen; r++ ) {
			
			if( i == 0 ) { 
				
				dLat = Data[ r ][ 2 ]; // Latitude of currently checked location in degrees 
				dLon = Data[ r ][ 3 ]; // Longitude of currently checked location in degrees
				Dist = this.GeoDistance( lat , lon , dLat , dLon ); // Distance between user defined location and current world point (in kilometers)
				
				if( MaxN > 1 ) { dList[ r ] = Dist; }
				
				if( cList.length == 0 || cList.indexOf( Data[ r ][ 5 ] ) > -1 ) {
				  
					if( Dist < Nearest[ 0 ].Dist && Dist >= minDist ) {
					
						Nearest[ 0 ] = NScheme( r , Dist );
						
					}
 
				}
				
			} else {
				
				if( cList.length == 0 || cList.indexOf( Data[ r ][ 5 ] ) > -1 ) {
				
					if(  dList[ r ] < Nearest[ i ].Dist && dList[ r ] > Nearest[ i-1 ].Dist && dList[ r ] > minDist   ) {
						 
						Nearest[ i ] = NScheme( r , dList[ r ] );					 
						
					}
				
				}
				
			}
 
			
		}
		
		// Add any found locations to the Result array
		if( Nearest[ i ].dIndex > -1 ) {
			Result.push( Nearest[ i ] );
		}
		
	}
	
	 
	
	console.timeEnd('FindNearest');
	
 
	return Result;
	
};

uGeo.prototype.GetUserLocation = function( success , fail , unsupported ) {
	
	var _this = this;
	
	// Try HTML5 geolocation.
	if (navigator.geolocation) {
 
	  navigator.geolocation.getCurrentPosition( function(position) {
	  
		var pos = {
		  lat: position.coords.latitude,
		  lon: position.coords.longitude
		};
		
		// User Latitude / Longitude coordinates (in degrees)
		_this.uLocation = pos;
 
		if( typeof success === "function" ) {
			success();
		}
		
	  }, function() {
		
		if( typeof fail === "function" ) {
			fail();
		}
		
	  } );
	  
	  // Exit before reaching the callback of the unsupported function
	  return;
	  
	}  
	
	if( typeof unsupported === "function" ) {
		unsupported();
	}
	return false;
	
	 
	  
	 
	
};

 

uGeo.prototype.FindNearestToUser = function( UpdateDelay , Quantity , MinimumDistance , CountryList ) {
	
	// Since setInterval goes into anonymous function, create reference to 'this' outside of it to allow access to root variables like wData
	var _this = this;
	
	 
	
	if( _this.wData.length > 0 && _this.uLocation !== false ) {
		
		
		_this.Print( Quantity , MinimumDistance , CountryList );
		return;
		
	}
	
	// Minimum delay between executions is 50ms. (consider changing based on performance tests..)
	var uDelay = ( UpdateDelay !== undefined && UpdateDelay > 50 ) ? UpdateDelay : 50; 
	
	var Check = setInterval(
		function() {
			
			if( _this.wData.length > 0  && _this.uLocation !== false ) {
				 
				 
				_this.Print( Quantity , MinimumDistance , CountryList );
				
				// Stop the Check function from executing if wData is loaded
				clearInterval( Check );
				
			}
			
		}, 100
	);

	
};


uGeo.prototype.Print = function( Quantity , MinimumDistance , CountryList ) {
		
	document.getElementById('uGeo_uLocation').innerHTML = "Latitude: "+this.uLocation.lat.toFixed(5) + " , Longitude: "+this.uLocation.lon.toFixed(5);
			
	var Nearest = this.FindNearest( this.uLocation.lat , this.uLocation.lon , Quantity , MinimumDistance , CountryList );
	
	document.getElementById('uGeo_Nearest').innerHTML = "";
	
	if( Nearest.length > 0 ) {
		for( var i=0;i<Nearest.length;i++) {
		
			document.getElementById('uGeo_Nearest').innerHTML += "<li>"+ this.wData[ Nearest[i].dIndex ][ 1 ] + ", "+ this.wData[ Nearest[i].dIndex ][ 5 ]+ " (Distance: "+Nearest[i].Dist.toFixed(2)+"km) </li>";
		
		}
	} else {
		document.getElementById('uGeo_Nearest').innerHTML = "No locations found. <br/>Consider adjusting your min. distance and/or country list parameters.";
	}
	
};
