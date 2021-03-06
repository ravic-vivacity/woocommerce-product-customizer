<?php
namespace MKL\PC;
/**
 *	Hooks
 *	
 * @author   Marc Lacroix
 */


if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

class Frontend_Cart {
	public function __construct() {
		$this->_hooks();
	}
	private function _hooks() {
		if( defined('WP_DEBUG') && WP_DEBUG == true ) {
			add_action( 'init', array( &$this, 'clear_cart_url' ) );
		}
		add_filter( 'woocommerce_add_cart_item_data', array( $this, 'wc_cart_add_item_data' ), 10, 3 ); 
		add_filter( 'woocommerce_get_item_data', array( $this, 'wc_cart_get_item_data' ), 10, 2 ); 
		// add_filter( 'woocommerce_add_cart_item', array( $this, 'wc_add_cart_item'), 10, 2 ); 
		// add_action( 'woocommerce_before_calculate_totals', array( &$this, 'pc_price_change' ) ); 
	}
	public function clear_cart_url() {
		global $woocommerce;
		if ( isset( $_GET['empty-cart'] ) ) {
			var_dump('clearing cart');
			$woocommerce->cart->empty_cart(); 
		}
	}

	// Filter data that's saved in the cart, and add the customizer data
	public function wc_cart_add_item_data( $cart_item_data, $product_id, $variation_id ) {
		
		// var_dump('-', $cart_item_data);
		if( mkl_pc_is_customizable($product_id) ) {

			if( isset($_POST['pc_customizer_data'] ) && '' != $_POST['pc_customizer_data'] ) { 
				if( $data = json_decode( stripcslashes( $_POST['pc_customizer_data'] ) ) ) {
					if( is_array( $data ) ) { 
						$layers = array();
						foreach( $data as $layer_data ) {
							$layers[] = new Choice( $product_id, $variation_id, $layer_data->layer_id, $layer_data->choice_id, $layer_data->angle_id );
							
						}
					}
					$cart_item_data['customizer_data'] = $layers; 
				}
			} 
		} 
		return $cart_item_data; 
	}


	public function wc_cart_get_item_data( $data, $cart_item ) { 

		if( mkl_pc_is_customizable( $cart_item['product_id'] ) ) { 
			$customizer_data = $cart_item['customizer_data'] ; 

			$choices = array(); 
			foreach ($customizer_data as $layer) { 
				if ( $layer->is_choice ) { 
					$choice_images = $layer->get_choice( 'images' );
					$choice_image = '';
					if( $choice_images[0]["thumbnail"]['id'] != '' ) {
						$choice_image = '<span class="choice-thumb"><img src="' . wp_get_attachment_url( $choice_images[0]["thumbnail"]['id'] ) . '" alt=""></span> ';
					}
					$item_data = Product::set_layer_item_meta( $layer );
					$layer_name = $item_data['label'];//apply_filters( 'mkl_pc_cart_get_item_data_layer_name', $layer->get_layer( 'name' ), $layer );
					$choices[$layer_name] = $choice_image . $item_data['value'];//apply_filters( 'mkl_pc_cart_get_item_data_choice_name', $choice_image . ' ' . $layer->get_choice( 'name' ), $layer ); 
				}
			}
			$data[] = array( 
				'key' => __('Customization', MKL_PC_DOMAIN), 
				'value' => $this->get_choices_html( $choices ), 
			);
			

		} else {

		}

		return $data; 

		/* 
		
		Get layers, choices
			foreach layers as layer

				get choice with ID 

				if( layer is not a choice ) { 
					get choice img
				} else {
					get choice [
						img 
						name 
					] (filter -> for extra price / other)
				}

		*/
	}

	public function get_choices_html( $choices ) {
		$output = '';
		$before = apply_filters( 'mkl_pc_cart_item_choice_before', '<div>' ); 
		$after = apply_filters( 'mkl_pc_cart_item_choice_after', '</div>' );
		foreach ( $choices as $layer => $choice ) {
			$output .= apply_filters( 'mkl_pc_cart_item_choice', $before . '<strong>' . $layer .'</strong>: ' . $choice . $after, $layer, $choice, $before, $after );
		}

		return $output;

	}

	// public function wc_add_cart_item( $data, $cart_item_key ) {

	// 	return $data;

	// }

	// public function pc_price_change( $cart_object ) {
	//     foreach ( $cart_object->cart_contents as $key => $value ) {
	//         if( mkl_pc_is_customizable($value['product_id']) ) {

	//         }
	//     }
	// }

}
