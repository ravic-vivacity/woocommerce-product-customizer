var PC = PC || {};
PC.fe = PC.fe || {};
PC.fe.models = PC.fe.models || {};

// Backbone.emulateHTTP = true;
PC.actionParameter = 'pc_get_data';
Backbone.Model.prototype.toJSON = function() {
	var json = _.clone(this.attributes);
	for(var attr in json) {
		if((json[attr] instanceof Backbone.Model) || (json[attr] instanceof Backbone.Collection)) {
			json[attr] = json[attr].toJSON(); 
		}
	}
	return json;
};


!(function($){
	'use strict';

	PC.fe.config = PC.fe.config || PC_config.config;
	PC.fe.config = _.extend( {
		
	}, PC.fe.config);

	$(document).ready(function() {
		// adds classes to body
		if( PC.utils._isTouch() ){
			$( 'body' ).addClass( 'is-touch' );
		}
		if( PC.utils._isMobile() ){
			$( 'body' ).addClass( 'is-mobile' );
		}

		// if ( typeof wc_add_to_cart_variation_params !== 'undefined' ) {
		// 	variation = true;
		// 	var $form = $( '.variations_form' );
		// 		// var $form = this;
		// 	$form.on( 'hide_variation', function( event ) {
		// 		event.preventDefault();
		// 		$( '.customize-product' ).attr( 'disabled', 'disabled' );
		// 	} );

		// 	$form.on( 'show_variation', function( event ) {
		// 		event.preventDefault(); 
		// 		var product_id = $('input[name="variation_id"]').val();
		// 		PC.fe.open( product_id, true );
		// 		$( '.customize-product' ).removeAttr( 'disabled' );
		// 	} );
		// }

		PC.fe.product_type = PC.fe.product_type || 'simple';
		
		$( '.customize-product-simple' ).on('click', function(event) {
			var product_id;
			//get product ID
			product_id = $('*[name="add-to-cart"]').val();
			// Open customizer
			PC.fe.open( product_id ); 
			
		});

		$('form.cart').each(function(index, form) { 

			$(form).find('button').attr('disabled', 'disabled'); 
			$(form).on('submit', function( event ){ 
				$('input[name=pc_customizer_data]').val( PC.fe.save_data.save() ); 
				if( $('input[name=pc_customizer_data]').val() == '' ) {
					event.preventDefault(); 
					console.log('empty data'); 
				}
			});
		});

		wp.hooks.addAction( 'PC.fe.start', function( customizer ){

			$('form.cart').find('button').removeAttr('disabled'); 

			$( 'input[name=quantity]' ).on( 'change',function(e) {
				var q = $(this).val();
				$( 'input[name=quantity]' ).each(function(index, el) {
					$(el).val(q);
				});
			} );
			
		});

		if( PC.fe.config.open_customizer && PC.fe.config.open_customizer == true ) {
			$( '.customize-product-simple' ).trigger( 'click' );
		}
	});


	PC.fe.init = function( product_id ) {
		this.layers = new PC.layers( PC.productData.layers ); 
		this.angles = new PC.angles( PC.productData.angles ); 
		if( PC.fe.product_type == 'simple' && PC.productData ) {
			this.contents = PC.fe.setContent.parse( PC.productData ); 
			this.modal.$el.trigger('content-is-loaded', 'an argument'); 
			// PC.fe.open( product_id, variation ); 
		} 
		this.product_id = product_id;
		
		$( document.body ).trigger( 'mkl-pc-init', product_id );
		wp.hooks.doAction( 'PC.fe.init', product_id );

	};



	PC.fe.open = function( product_id ) {

		// variations: if product_id is different from active, we remove the modal to create a new one.
		if( product_id == PC.fe.active_product ) {
			this.modal.open(); 
			return;
		}

		if( product_id != PC.fe.active_product && this.modal && PC.fe.inline != true ) {
			this.modal.remove();
			this.modal = null;
		}

		PC.fe.active_product = product_id; 

		this.modal = this.modal || new PC.fe.views.customizer( product_id ); 

		PC.fe.init( product_id ); 

		// if( !this.layers && !variation ) {
		// 	return;
		// }
		// if( ( variation && !PC.fe.variations_content ) || ( variation && !PC.fe.variations_content[product_id] ) ) {
		// 	PC.fe.init( product_id, variation );
		// 	return;
		// }
		// console.log( variation, ( variation && !PC.fe.variations_content ),( variation && !PC.fe.variations_content[product_id] ) );
		// console.log('gonna open without INIT (because should already be done)');
		
		/*
		check if product_id is different from before
		*/
		// console.log(this.layers, this.angles, this.contents);

	};

	PC.fe.close = function() {
		if( this.modal ) 
			this.modal.close();
	}

	PC.fe.setContent = {
		url: function() { 
			var action = PC.actionParameter,
				data = 'content';
			return ajaxurl + '?action='+action+'&data='+data+'&id='+this.id
		},

		idAttribute: 'product_id',
		defaults: {
			product_type:'simple', 
			modified: false, 
		}, 
		parse: function( response ) {
			// var response = null;
			var content = new PC.content_list();
			if( ! response instanceof Object ) {
				return content;
			} else if( undefined == response.content || response.content == false || response.content == 'false' ) {
				return content;
			}

			// content.add( response.content );
			$.each( response.content, function(key, value) {
				if( value.choices && value.choices.length > 0 ) {
					value.choices = new PC.choices(value.choices);
					content.add( value );
				}
				// content.add({ key = new PC.choices(value);
			});
			// this.set('content', content);
			return { content: content };
			// this.set()
		}
	};	

	PC.fe.getLayerContent = function( id ) {
		if ( PC.fe.contents.content.get( id ) ) 
			return PC.fe.contents.content.get( id ).attributes.choices; 
		return false;
	};

	/*
	// product is customizable == true
		// PRODUCT IS SIMPLE 
			-> SERVE Structure and CONTENT
		// Product is VARIABLE
			-> SERVE Structure
			-> on SELECT VARIATION 
				-> Enable Customize button

			-> Customize button .onClick 
				-> GET Content 


	// OPEN CUSTOMIZER 
		// getData
			-> if SIMPLE 
			jSON to COLLECTIONS ANGLES/LAYERS/CONTENT
			-> if VARIATION
			GET VARIATION CONTENT
			jSON to COLLECTIONS ANGLES/LAYERS/CONTENT

		// VIEWS: 
			CUSTOMIZER
				TOOLBAR
					HEADER
						TITLE
					LIST
						LAYERS
							LAYER
						CHOICES
							HEADER (CLOSE + LAYER)
							CHOICE

				VIEWER
					BG
					LAYER IMAGE



	*/

})(jQuery);

PC.utils = PC.utils || {
	_isTouch: function() {
		// var isTouchDevice = navigator.userAgent.match(/(iPhone|iPod|iPad|Android|playbook|silk|BlackBerry|BB10|Windows Phone|Tizen|Bada|webOS|IEMobile|Opera Mini)/),
			var isTouch = (('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0) || (navigator.maxTouchPoints));
		return isTouch;
	},
	_isMobile: function() {
		var isTouchDevice = navigator.userAgent.match(/(iPhone|iPod|iPad|Android|playbook|silk|BlackBerry|BB10|Windows Phone|Tizen|Bada|webOS|IEMobile|Opera Mini)/);
		return isTouchDevice;
	}

};