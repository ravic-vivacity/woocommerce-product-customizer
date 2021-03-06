var PC = PC || {};
PC.views = PC.views || {};

/**
TODO: 
- Get product / + variation ID
	-> use product ID to store layers + angles
	-> if variable, use variation ID to store content

*/
(function($){
	PC.views.layers = Backbone.View.extend({
		tagName: 'div',
		className: 'state layers-state', 
		template: wp.template('mkl-pc-structure'), 
		orderAttr: 'order', 
		collectionName: 'layers', 
		
		initialize: function( options ) {

			this.options = options || {};
			this.admin = PC.app.get_admin();
			this.product_id = options.app.product.id; 


			if( this.admin[this.collectionName] ) { 

				this.col = this.admin[this.collectionName];
				this.render();
			} else {
				
				var loaded_data = this.admin.model.get(this.collectionName); 
				// if the data fetched from the admin view has layers
				if( loaded_data != false ) {
					this.col = this.admin[this.collectionName] = new PC[this.collectionName]( loaded_data );
				} else {
					// else we create an empty collection
					this.col = this.admin[this.collectionName] = new PC[this.collectionName]();
				}

				this.render();

			}
		},
		single_view: function() { return PC.views.layer; },
		events: {
			'click .add-layer': 'create',
			'keypress .structure-toolbar input': 'create',
			'update-sort': 'update_sort',
			// 'remove': 'is_being_removed', 
			'save-state': 'save_layers',

		}, 
		is_being_removed: function() {
			// console.log('Layers View is being removed.'); 
		},
		render: function( ) {

			this.$el.append( this.template({ input_placeholder: PC.lang[this.collectionName +'_new_placeholder'] }) ); 
			this.$list = this.$('.layers'); 
			this.$form = this.$('.media-sidebar'); 
			this.$new_input = this.$('.structure-toolbar input'); 
			this.add_all( this.col ); 
			this.listenTo( this.col, 'add', this.add_one);
			this.listenTo( this.col, 'change', this.layers_changed);
			this.listenTo( this.col, 'destroy', this.removed_model);
			return this;
		},
		removed_model: function( m ){
			// remove 
			this.admin.remove_relationships( this.collectionName, m );
		},
		update_sort: function( event, changed_model, position ) {
			
			this.col.remove(changed_model);

			this.col.each(function (model, index) {
				var ordinal = index; 
				if (index >= position) { 
					ordinal += 1;
				}

				model.set('order', ordinal); 
	        });
			changed_model.set('order', position); 
			
			this.col.add(changed_model, {at: position});
			this.col.sort({silent: true});
			this.add_all( this.col );
			// this.render();

			// to update ordinals on server:
			// var ids = this.col.pluck('id');
			// $('#post-data').html('post ids to server: ' + ids.join(', '));
		},

		add_one: function( layer ) {
			// console.log('add_one');
			// console.log(this, this.single_view());
			var singleView = this.single_view();
			var new_layer = new singleView({ model: layer, form_target: this.$form, collection: this.col });
			this.$list.append( new_layer.render().el );

		},

		add_all: function( collection ){
			this.$list.empty();
			collection.each( this.add_one, this ); 
			// .ui-sortable-handle 
			var that = this;
			this.$list.sortable({
					containment:          'parent', 
					items:                '.mkl-list-item',
					cursor:               'move',
					axis:                 'y',
					handle:               '.sort',
					scrollSensitivity:    40,
					forcePlaceholderSize: true,
					helper:               'clone',
					opacity:              0.65,
					stop: 				  function(event, s){
						s.item.trigger('drop', s.item.index());

					}
					
			});

		},
		create: function( event ) {
			
			if( event.type == 'keypress' ) {
				if ( event.which !== 13 ) {
					return;
				}
			} 
			if( !this.$new_input.val().trim() ) {
				return;
			}
			// Add the new layer's model to the collection
			this.col.create( this.new_attributes( this.$new_input.val().trim() ) ); 
			

			this.$new_input.val(''); 			
			
		},
		layers_changed: function(e) {
			// if something has changed in the layers collection
			PC.app.is_modified[this.collectionName] = true; 

		},
		layers_loaded: function( e ) {
			this.render();
		},
		new_attributes: function( name ) {
			// console.log(PC.app.get_new_id( this.col.models ));
			return {
				_id: PC.app.get_new_id( this.col ),
				name: name,
				order: this.col.nextOrder(),
				active: true,
				// completed: false
			};
		},
		get_col: function() {
			return this.col;
		},

	});

	

	// SINGLE LAYER VIEW (List item)
	PC.views.layer = Backbone.View.extend({
		tagName: 'div',
		className: 'layer mkl-list-item',
		template: wp.template('mkl-pc-structure-layer'),
		edit_view: function(){ return PC.views.layer_form; },
		// formTemplate: wp.template('mkl-pc-structure-layer-form'),

		initialize: function( options ) {
			this.options = options || {}; 
			this.form_target = options.form_target; 
			this.listenTo( this.model, 'change:active', this.activate ); 
			this.listenTo( this.model, 'change:name change:image', this.render); 
			this.listenTo( this.model, 'destroy', this.remove ); 
		},
		events: {
			'click' : 'edit',
			'drop': 'drop', 

		},
		render: function() {
			// console.log(this.model);
			this.$el.html( this.template( this.model.attributes ) );
			if( this.model.get('active') == true || this.model.get('active') == 'true' ) this.edit();
			return this;
		},
		edit: function( event ) { 
			var editView = this.edit_view();
			if( !event ) {
				if( !this.form ) {
					this.options.collection.each(function(model) {
						model.set('active' , false);
					});
					this.model.set( 'active' , true );
					this.activate();
					this.form = new editView( this.options );
					this.form_target.html( this.form.render().el );
				}
			} else {
				if( this.model.get('active') == false || this.model.get('active') == 'false' ) {
					this.options.collection.each(function(model) {
						model.set('active' , false);
					});
					this.model.set( 'active' , true );

					if( this.form ) this.form.remove();
					this.form = new editView( this.options );
					this.form_target.html( this.form.render().el );
				}
			}
		},
		activate: function(){
			if(this.model.get('active') === true) {
				this.$el.addClass('active');
			} else {
				this.$el.removeClass('active');
			}
		},
		drop: function( event, index ) {
			// Remove the active state after drop
			if( this.model.get('active') === true ) {
				this.model.set('active', false);
			}

			// triggers the re-order event
			this.$el.trigger('update-sort', [this.model, index]);
			// Remove the form view
			if( this.form ) this.form.remove();
		}
	});

	// LAYER EDITING VIEW
	PC.views.layer_form = Backbone.View.extend({
		tagName: 'div',
		className: 'layer-form',
		template: wp.template('mkl-pc-structure-layer-form'),

		initialize: function( options ) {
			this.listenTo(this.model, 'destroy', this.remove); 
		},
		events: {
			// 'click' : 'edit',
			'click .delete-layer': 'delete_layer',
			'click .confirm-delete-layer': 'delete_layer',
			'click .cancel-delete-layer': 'delete_layer',
			// instant update of the inputs
			'keyup .setting input': 'form_change',
			'keyup .setting textarea': 'form_change',
			'change .setting input': 'form_changed',
			'change .setting textarea': 'form_changed',

			'click [type="checkbox"]': 'form_change',

			'click .edit-attachment': 'edit_attachment',
			'select-media': 'select_attachment',
		},
		render: function() {
			this.$el.html( this.template( this.model.attributes ) );
			this.delete_btns = {
				prompt: this.$('.delete-layer'),
				confirm: this.$('.prompt-delete'),
				// cancel: this.$('.cancel-delete-layer'),
			};
			return this;
		},
		form_change: function( event ) {

			var input = $(event.currentTarget);
			var setting = input.data('setting');

			if( event.type == 'click' ) {
				// checkbox
				var new_val = input.prop('checked'); 
			} else {

				// text + textarea
				var new_val = input.val().trim();
			}
			console.log( new_val );
			if( this.model.get(setting) != new_val ) {
				this.model.set(setting, new_val);
			}

		},
		form_changed: function() {
			// this.model.save();
		},
		delete_layer: function( event ) {
			var bt = $(event.currentTarget);
			var action = bt.data('delete');
			//console.log( this.model.sync );
			switch (action) {
				case 'prompt':
					bt.addClass('hidden');
					this.delete_btns.confirm.removeClass('hidden');
					break;
				case 'confirm':
					this.model.destroy();

					// console.log('Delete this model.');
					break;
				case 'cancel':
					this.delete_btns.prompt.removeClass('hidden');
					this.delete_btns.confirm.addClass('hidden');
					// this.delete_btns.cancel.addClass('hidden');
					break;

			}
		},
		edit_attachment: function(e) {
			e.preventDefault();

			PC.media.open( {el: this.$el, selection: this.model.get('image').id } );

		},

		select_attachment: function(e, attachment) {
			
			this.model.set('image', {
				url: attachment.get('url'),
				id: attachment.id
			});
			this.render();
		},
	});

	PC.views.layer_img = Backbone.View.extend({

	});

})(jQuery);