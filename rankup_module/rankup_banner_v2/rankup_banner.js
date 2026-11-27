var RANKUPBanner = function(id, type) {
	this.id = id;
	this.type = type;
}

RANKUPBanner.prototype = {
	init:function(option) {
		require.config({
			baseUrl: '/Libs/_js'
		});

		this.option = option;
		switch (this.type) {
			case 'slide':
				this.init_slide();
			break;
			case 'fade':
				this.init_fade();
			break;
			case 'carousel':
				this.init_carousel();
			break;
		}
	},
	init_slide: function(){
		var me = this;
		var opt = this.option;

		require(['jssor/jssor.core','jssor/jssor.slider.min','jssor/jssor.utils'], function($) {
			var option = {
				$FillMode: 1, 
				$AutoPlay: true,
				$PauseOnHover:opt.hover,
				$AutoPlayInterval:opt.interval,
				$SlideDuration:opt.duration,
				$PlayOrientation:opt.orientation_play,
				$DragOrientation:opt.orientation_drag
			};
			//醫고댄 ъ
			if(opt.arrow) {
				var arrow_option = {
					$ArrowNavigatorOptions: {
						$Class: $JssorArrowNavigator$,
						$ChanceToShow: 2,
						$AutoCenter: 2,
						$Steps: 1
					}	
				};
				option = $J.extend({}, option, arrow_option);
			}

			//遺由ъ
			if(opt.bullet) {
				$J('.banner-bullet').css('display','');
				var bullet_option = {
					$BulletNavigatorOptions: {
						$Class: $JssorBulletNavigator$,
						$ChanceToShow: 2,
						$AutoCenter: opt.bullet_position,
						$Steps: 1,
						$Lanes: 1,
						$SpacingX: 5,
						$SpacingY: 5,
						$Orientation: 1
					}
				};
				option = $J.extend({}, option, bullet_option);
			}
			var slide = new $JssorSlider$(me.id, option);
			var container = document.getElementById(me.id).parentElement;
			var originalWidth = slide.$OriginalWidth();
			function fitBanner() {
				var width = Math.min(originalWidth, container.clientWidth);
				if (width > 0 && width !== slide.$ScaleWidth()) slide.$ScaleWidth(width);
			}
			fitBanner();
			if (window.ResizeObserver) {
				new ResizeObserver(fitBanner).observe(container);
			} else {
				window.addEventListener('resize', fitBanner);
			}
			$J('#'+me.id).find('div.preview').css('display','none');
			$J('#'+me.id).find('div.slides').css('display','');
		});
	},
	init_fade: function() {
		var me = this;
		var opt = this.option;

		var _SlideshowTransitions = [
			{ $Duration: opt.duration, $Opacity: 2 }
		];

		require(['jssor/jssor.core','jssor/jssor.slider.min','jssor/jssor.utils'], function($) {
			var option = {
				$AutoPlay: true,
				$AutoPlaySteps: 1,
				$AutoPlayInterval: opt.interval,
				$PauseOnHover:opt.hover,
				$ArrowKeyNavigation: false,
				$SlideDuration: 500,
				$MinDragOffsetToSlide: 20,
				$SlideSpacing: 0,
				$DisplayPieces: 1,
				$ParkingPosition: 0,
				$PlayOrientation: 1,
				$DragOrientation: 0,  
				$SlideshowOptions: {
					$Class: $JssorSlideshowRunner$,
					$Transitions: _SlideshowTransitions,
					$TransitionsOrder: 1,
					$ShowLink: true
				}
			};
			
			var slide = new $JssorSlider$(me.id, option);
			
		});
	},
	init_carousel: function() {
		var me = this;
		var opt = this.option;

		require(['jssor/jssor.core','jssor/jssor.slider.min','jssor/jssor.utils'], function($) {
			var option = {
				$AutoPlay: true,
				$AutoPlaySteps:opt.play_step,
				$PauseOnHover:opt.hover,
				$AutoPlayInterval:opt.interval,
				$SlideDuration:opt.duration,
				$PlayOrientation:opt.orientation_play,
				$DragOrientation:opt.orientation_drag,
				$SlideWidth:opt.slide_width,
				$SlideSpacing:opt.slide_spacing,
				$DisplayPieces:opt.display_pieces,

				$MinDragOffsetToSlide: 20,
				$ParkingPosition: 0,
				$UISearchMode: 1
			};

			//醫고댄 ъ
			if(opt.arrow) {
				var arrow_option = {
					$ArrowNavigatorOptions: {
						$Class: $JssorArrowNavigator$,
						$ChanceToShow: 2,
						$AutoCenter: 2,
						$Steps: 1
					}	
				};
				option = $J.extend({}, option, arrow_option);
			}

			//遺由ъ
			if(opt.bullet) {
				$J('.banner-bullet').css('display','');
				var bullet_option = {
					$BulletNavigatorOptions: {
						$Class: $JssorBulletNavigator$,
						$ChanceToShow: 2,
						$AutoCenter: opt.bullet_position,
						$Steps: 1,
						$Lanes: 1,
						$SpacingX: 5,
						$SpacingY: 5,
						$Orientation: 1
					}
				};
				option = $J.extend({}, option, bullet_option);
			}

			var slide = new $JssorSlider$(me.id, option);
			$J('#'+me.id).find('div.loading').css('display','none');
			$J('#'+me.id).find('div.slides').fadeIn();
    	});
	}
}