﻿if (typeof SlimStatAdminParams == 'undefined') SlimStatAdminParams = {current_tab: 1, async_load: 'no', refresh_interval: 0, expand_details: 'no', datepicker_image: '', text_direction: '', use_slimscroll: 'yes'};
var SlimStatAdmin = {
	// Public variables
	chart_data: [],
	chart_info: [],
	ticks: [],

	// Private variables
	_chart_options: {
		grid: {
			backgroundColor: '#ffffff',
			borderWidth: 0,
			hoverable: true,
			clickable: true
		},
		legend: {
			container: '#chart-legend',
			noColumns: 4
		},
		pan: { interactive: true },
		series: {
			lines: { show: true },
			colors: [ { opacity: 0.85 } ],
			shadowSize: 5
		},
		shadowSize: 0,
		zoom: { interactive: true }
	},
	_placeholder: null,
	_qtip_previous_point: null,
	_refresh_timer: [0, 0],
	_tooltip: {},

	chart_color_weekends: function(){
		if (!SlimStatAdmin.chart_info.daily_chart){
			return true;
		}

		jQuery(".xAxis .tickLabel").each(function(i){
			myDate = new Date(SlimStatAdmin.chart_info.current_year, SlimStatAdmin.chart_info.current_month-1, parseInt(jQuery(this).html()), 3, 30, 0);
			if(myDate.getDay()%6 == 0){
				jQuery(this).css('color','#ccc');
			}
		});
	},

	chart_init: function() {
		SlimStatAdmin._placeholder = jQuery("#chart-placeholder");

		// Don't do anything if no placeholder or if hidden
		if (!SlimStatAdmin._placeholder.length || SlimStatAdmin._placeholder.is(':hidden')){
			return true;
		}

		max_y_axis = 0;
		for (i in SlimStatAdmin.chart_data){
			max = SlimStatAdmin.chart_data[i].data.reduce(function(max, arr){ 
				return Math.max(max, arr[1]); 
			}, -Infinity)+1;
			if (max > max_y_axis) max_y_axis = max;
		}

		// Calculate the remaining options
		SlimStatAdmin._chart_options.colors = (SlimStatAdmin.chart_data.length == 4)?['#ccc', '#999', '#bbcc44', '#21759b', '#02c907']:['#bbcc44', '#21759b', '#02c907'],
		SlimStatAdmin._chart_options.xaxis = {
			ticks: (SlimStatAdmin.ticks[0][1].indexOf('/') > 0 && SlimStatAdmin.ticks.length > 16) ? [] : SlimStatAdmin.ticks,
			tickDecimals: 0,
			tickLength: 0,
			tickSize: 1,
			panRange: [0, SlimStatAdmin.chart_data[0].data.length-1],
			zoomRange: [5, SlimStatAdmin.chart_data[0].data.length-1],
		};
		if (SlimStatAdminParams.text_direction == 'rtl'){
			SlimStatAdmin._chart_options.xaxis.transform = function(v) {
				return -v;
			};
			SlimStatAdmin._chart_options.xaxis.inverseTransform = function(v) {
				return -v;
			};
		}

		SlimStatAdmin._chart_options.yaxis = {
			tickDecimals: 0,
			zoomRange: [5, max_y_axis],
			panRange:[0, max_y_axis]
		};

		// Draw the chart
		jQuery.plot(SlimStatAdmin._placeholder, SlimStatAdmin.chart_data, SlimStatAdmin._chart_options);
		SlimStatAdmin.chart_color_weekends();
		
		// Enable tooltips
		SlimStatAdmin._tooltip = SlimStatAdmin._placeholder.qtip({
			content: ' ',
			hide: {
				event: false,
				fixed: true
			},
			id: 'chart-placeholder',
			position: {
				target: 'mouse',
				viewport: SlimStatAdmin._placeholder,
				adjust: {
					x: 15
				}
			},
			prerender: true,
			show: false,
			style: {
				classes: 'qtip-dark'
			}
		});
		SlimStatAdmin._placeholder.bind("plothover", function (event, coords, item) {
			// Grab the API reference
			var api = jQuery(this).qtip();

			// If we weren't passed the item object, hide the tooltip and remove cached point data
			if (!item) {
				api.cache.point = false;
				return api.hide(item);
			}

			SlimStatAdmin._previous_point = api.cache.point;
			if (SlimStatAdmin._previous_point !== item.dataIndex) {
				api.cache.point = item.dataIndex;

				label = item.series.label.replace(/[0-9\/\:]+(.*)(am|pm)?/gi, '');
				if (SlimStatAdmin.ticks[item.dataIndex][1].indexOf('/') > 0){
					label += ' ' + SlimStatAdmin.ticks[item.dataIndex][1];
				}
				api.set('content.text', label + ': ' + item.datapoint[1]);

				api.elements.tooltip.stop(1, 1);
				api.show(item);
			}
		});
/*
		SlimStatAdmin._placeholder.bind('plotclick', function(event, pos, item){
			if (item && typeof item.series.label != 'undefined'){
				if (item.seriesIndex == 1 && typeof SlimStatAdmin.chart_data[item.seriesIndex].data[item.datapoint[0]-SlimStatAdmin.chart_info.rtl_filler_previous][2] != 'undefined'){
					document.location.href = SlimStatAdmin.chart_data[item.seriesIndex].data[item.datapoint[0]-SlimStatAdmin.chart_info.rtl_filler_previous][2].replace(/&amp;/gi,'&');
				}
				if (item.seriesIndex != 1 && typeof SlimStatAdmin.chart_data[item.seriesIndex].data[item.datapoint[0]-SlimStatAdmin.chart_info.rtl_filler_current][2] != 'undefined'){
					document.location.href = SlimStatAdmin.chart_data[item.seriesIndex].data[item.datapoint[0]-SlimStatAdmin.chart_info.rtl_filler_current][2].replace(/&amp;/gi,'&');
				}
			}
		});
*/
		SlimStatAdmin._placeholder.bind('dblclick', function(event){
			jQuery.plot(SlimStatAdmin._placeholder, SlimStatAdmin.chart_data, SlimStatAdmin._chart_options);
			SlimStatAdmin.chart_color_weekends();
		});

		SlimStatAdmin._placeholder.bind('plotzoom', SlimStatAdmin.chart_color_weekends);
		SlimStatAdmin._placeholder.bind('plotpan', SlimStatAdmin.chart_color_weekends);
	},

	parse_url_filters: function(report_id, href){
		filters_parsed = [];
		filters_to_add = href.split('&');
		jQuery('#slimstat-filters-form').attr('action', filters_to_add[0]);

		for (i in filters_to_add){
			if (filters_to_add[i].indexOf('fs\%5B') != 0) continue;
			
			filter_components = filters_to_add[i].split('=');
			filter_components[0] = decodeURIComponent(filter_components[0]);
			jQuery('input[name="'+filter_components[0]+'"]').remove();

			filters_parsed[filter_components[0]] = [report_id, filter_components[1].replace('+', ' ')];
		}
		return filters_parsed;
	},

	add_filters_to_form: function(filters_parsed, reset_existing_filters){
		if (reset_existing_filters){
			jQuery('.slimstat-post-filter').remove();
		}
		
		for (i in filters_parsed){
			if (jQuery.inArray(i, ['fs[minute]','fs[hour]','fs[day]','fs[month]','fs[year]','fs[interval_direction]','fs[interval]','fs[interval_hours]','fs[interval_minutes]']) == -1){
				jQuery('<input>').attr('type', 'hidden').attr('name', i).attr('class', 'slimstat-post-filter slimstat-temp-filter '+filters_parsed[i][0]).val(filters_parsed[i][1]).appendTo('#slimstat-filters-form');
			}
			else{
				field_id = i.replace('fs[', '#slimstat-filter-').replace(']', '');
				field_val = filters_parsed[i][1].split(' ');
				jQuery(field_id).val(field_val[1]);
			}
		}
	},
	
	remove_filters_from_form: function(filters_parsed){
		for (i in filters_parsed){
			jQuery('input[name="'+i.replace('[', '\\[').replace(']', '\\]')+'"]').remove();
		}
	},

	refresh_countdown: function(){
		SlimStatAdmin._refresh_timer[1]--;
		if (SlimStatAdmin._refresh_timer[1] == -1){
			SlimStatAdmin._refresh_timer[1] = 59;
			SlimStatAdmin._refresh_timer[0] = SlimStatAdmin._refresh_timer[0]-1;
		}
		jQuery('.refresh-timer').html(SlimStatAdmin._refresh_timer[0]+':'+((SlimStatAdmin._refresh_timer[1]<10)?'0':'')+SlimStatAdmin._refresh_timer[1]);
		if (SlimStatAdmin._refresh_timer[0] > 0 || SlimStatAdmin._refresh_timer[1] > 0){
			refresh_handle = window.setTimeout("SlimStatAdmin.refresh_countdown();", 1000);
		}
		else{
			report_id = 'slim_p7_02';
			data = {action: 'slimstat_load_report', report_id: report_id, security: jQuery('#meta-box-order-nonce').val()};
			jQuery('#'+report_id+' .inside').html('<p class="loading"></p>');
			SlimStatAdmin.refresh_report(report_id, data);

			window.clearTimeout(refresh_handle);
			SlimStatAdmin._refresh_timer[0] = parseInt(SlimStatAdminParams.refresh_interval/60);
			SlimStatAdmin._refresh_timer[1] = SlimStatAdminParams.refresh_interval%60;
			refresh_handle = window.setTimeout("SlimStatAdmin.refresh_countdown();", 1000);
		}
	},
	
	refresh_report: function(report_id, data){
		// Get the data from the hidden form
		filters_input = jQuery('#slimstat-filters-form .slimstat-post-filter').toArray();
		for (i in filters_input){
			data[filters_input[i]['name']] = filters_input[i]['value'];
		}

		jQuery('#'+report_id+' .inside').html('<p class="loading"><i class="slimstat-font-spin1 animate-spin"></i></p>');

		jQuery.post(ajaxurl, data, function(response){
			if (report_id.indexOf('_01') > 0){
				jQuery('#'+report_id + ' .inside').html(response);
				SlimStatAdmin.chart_init();
			}
			else{
				jQuery('#'+report_id + ' .inside').fadeOut(700, function(){
					jQuery(this).html(response).fadeIn(700);
				});
			}
		});

		// Remove filters set by other Ajax buttons
		jQuery('.slimstat-temp-filter').remove();
	}
}

jQuery(function(){
	// Refresh page every X seconds
	if (SlimStatAdminParams.refresh_interval > 0 && !jQuery('[name^="fs\[is_past\]"]').length){
		SlimStatAdmin._refresh_timer[0] = parseInt(SlimStatAdminParams.refresh_interval/60);
		SlimStatAdmin._refresh_timer[1] = SlimStatAdminParams.refresh_interval%60;
		refresh_handle = window.setTimeout("SlimStatAdmin.refresh_countdown();", 1000);
	}

	// Refresh report if (re)activated via the checkbox under Screen Options
	jQuery('input.hide-postbox-tog[id^=slim_]').bind('click.postboxes', function (){
		var report_id = jQuery(this).val();
		var data = {action: 'slimstat_load_report', report_id: report_id, security: jQuery('#meta-box-order-nonce').val()}
		jQuery('#'+report_id+' .inside').html('<p class="loading"></p>');

		if (jQuery(this).prop("checked") && jQuery('#'+jQuery(this).val()).length){
			SlimStatAdmin.refresh_report(report_id, data);
		}
	});
	
	// Filters: add form if not available (Dashboard)
	if (!jQuery('#slimstat-filters-form').length){
		jQuery('<form id="slimstat-filters-form" method="post"/>').appendTo('body');
	}

	// Filters: Lock value input field based on operator drop down selection
	jQuery('#slimstat-filter-operator').change(function(){
		if (this.value=='is_empty'||this.value=='is_not_empty'){
			jQuery('#slimstat-filter-value').attr('readonly', 'readonly');
		}
		else{
			jQuery('#slimstat-filter-value').removeAttr('readonly');
		}
	});

	// Filters: empty on focus
	jQuery('.empty-on-focus').focus(function(){
		if (this.value == this.defaultValue) this.value = '';
	});
	jQuery('.empty-on-focus').blur(function(){
		if (this.value == '') this.value = this.defaultValue;
	});

	// Show/Hide Date Dropdown Filters
	jQuery('#slimstat-date-filters a').click(function(e){
		e.preventDefault();
		jQuery('#slimstat-date-filters span').slideToggle(300);
		jQuery(this).toggleClass('open');
	}).children().click(function(){
	  return false;
	});
	
	// Date Filters: Datepicker
	if (typeof jQuery('.slimstat-filter-date').datepicker == 'function'){
		jQuery('.slimstat-filter-date').datepicker({
			buttonImage: SlimStatAdminParams.datepicker_image,
			buttonImageOnly: true,
			changeMonth: true,
			changeYear: true,
			dateFormat: 'yy-m-d',
			maxDate: new Date,
			nextText: '&raquo;',
			prevText: '&laquo;',
			showOn: 'both',
			
			onClose: function(dateText, inst) {
				if (!dateText.length) return true;
				jQuery('#slimstat-filter-day').val( dateText.split('-')[2] );
				jQuery('#slimstat-filter-month').val( dateText.split('-')[1] );
				jQuery('#slimstat-filter-year').val( dateText.split('-')[0] );
			}
		});
	}

	// Filters: Remove selected when X is clicked
	jQuery('a.slimstat-remove-filter').click(function(e){
		e.preventDefault();

		filters_to_remove = SlimStatAdmin.parse_url_filters('p0', jQuery(this).attr('href'));
		SlimStatAdmin.remove_filters_from_form(filters_to_remove);

		jQuery('#slimstat-filters-form').submit();
		jQuery('.slimstat-temp-filter').remove();
		return false;
	});

	// Send filters as post requests
	jQuery(document).on('click', '.slimstat-filter-link, #toplevel_page_wp-slim-view-1 li a, #wp-admin-bar-slimstat-header li a', function(e){
		e.preventDefault();

		if (!jQuery('#slimstat-filters-form').length){
			return true;
		}

		filters_parsed = SlimStatAdmin.parse_url_filters('p0', jQuery(this).attr('href'));
		SlimStatAdmin.add_filters_to_form(filters_parsed, (typeof jQuery(this).attr('data-reset-filters') != 'undefined'));

		jQuery('#slimstat-filters-form').submit();
		jQuery('.slimstat-temp-filter').remove();
		return false;
	});

	// Behavior associated to all the 'ajax-based' buttons
	jQuery(document).on('click', '[id^=slim_] .button-ajax', function(e){
		e.preventDefault();
		report_id = jQuery(this).parents('.postbox').attr('id');

		if (typeof jQuery(this).attr('href') != 'undefined'){
			filters_parsed = SlimStatAdmin.parse_url_filters(report_id, jQuery(this).attr('href'));
			SlimStatAdmin.add_filters_to_form(filters_parsed);

			// Remember the new filter for when the report is refreshed
			if (typeof filters_parsed['fs[start_from]'] != 'undefined' && jQuery('#'+report_id+' .refresh').length){
				href = jQuery('#'+report_id+' .refresh').attr('href');
				href_clean = href.substring(0, href.indexOf('&fs%5Bstart_from'));
				if (href_clean != '') href = href_clean;
				jQuery('#'+report_id+' .refresh').attr('href', href+'&fs%5Bstart_from%5D='+filters_parsed['fs[start_from]']);
			}
		}

		data = {action: 'slimstat_load_report', report_id: report_id, security: jQuery('#meta-box-order-nonce').val(), current_tab: SlimStatAdminParams.current_tab};
		SlimStatAdmin.refresh_report(report_id, data);
		
		if (SlimStatAdminParams.use_slimscroll == 'yes'){
			jQuery('#'+report_id+' .inside').slimScroll({scrollTo : '0px'});
		}
		
		if (typeof refresh_handle != 'undefined' && !jQuery('[name^="fs\[is_past\]"]').length){
			window.clearTimeout(refresh_handle);
			SlimStatAdmin._refresh_timer[0] = parseInt(SlimStatAdminParams.refresh_interval/60);
			SlimStatAdmin._refresh_timer[1] = SlimStatAdminParams.refresh_interval%60;
			refresh_handle = window.setTimeout("SlimStatAdmin.refresh_countdown();", 1000);
		}
	});

	// Asynchronous Reports
	if (SlimStatAdminParams.async_load == 'yes'){
		jQuery('div[id^=slim_]').each(function(){
			report_id = jQuery(this).attr('id');
			data = {action: 'slimstat_load_report', report_id: report_id, security: jQuery('#meta-box-order-nonce').val(), current_tab: SlimStatAdminParams.current_tab}
			SlimStatAdmin.refresh_report(report_id, data);
		});
	}

	// Hide Admin Notice
	jQuery(document).on('click', '#slimstat-hide-admin-notice', function(e){
		e.preventDefault();
		jQuery('.updated.slimstat-notice').slideUp(1000);
		data = {action: 'slimstat_hide_admin_notice', security: jQuery('#meta-box-order-nonce').val()};
		jQuery.ajax({
			url: ajaxurl,
			type: 'post',
			async: true,
			data: data
		});
	});

	// Enable ads on click
	jQuery(document).on('click', '#slimstat-enable-ads-toggle', function(e){
		e.preventDefault();
		jQuery('.updated.slimstat-notice').slideUp(1000);
		data = {action: 'slimstat_enable_ads_feature', security: jQuery('#meta-box-order-nonce').val()};
		jQuery.ajax({
			url: ajaxurl,
			type: 'post',
			async: true,
			data: data
		});
	});

	// Delete Pageview
	jQuery(document).on('click', '.slimstat-delete-entry', function(e){
		var target = jQuery(this);

		e.preventDefault();
		data = {action: 'slimstat_delete_pageview', security: jQuery('#meta-box-order-nonce').val(), pageview_id : target.attr('data-pageview-id')};
		jQuery.ajax({
			url: ajaxurl,
			type: 'post',
			async: true,
			data: data
		}).done(function(){
			target.parents('p').fadeOut(1000);
		});
	});

	// SlimScroll init
	if (SlimStatAdminParams.use_slimscroll == 'yes'){
		jQuery('[id^=slim_]:not(.tall) .inside').slimScroll({
			distance: '2px',
			opacity: '0.15',
			size: '5px',
			wheelStep: 10
		});
		jQuery('[id^=slim_].tall .inside').slimScroll({
			distance: '2px',
			height: '630px',
			opacity: '0.15',
			size: '5px',
			wheelStep: 10
		});
	}

	// ToolTips
	jQuery(document).on('mouseover', '.slimstat-tooltip-trigger', function(e){
		jQuery(this).qtip({
			overwrite: false,
			content: {
				text: jQuery(this).next('.slimstat-tooltip-content')
			},
			show: {
				event: e.type,
				ready: true
			},
			position: {
				adjust: {
					x: 15
				},
				viewport: jQuery(window)
			},
			style: {
				classes: 'qtip-dark'
			}
		}, e);
	});
	
	// Row Details
	if (SlimStatAdminParams.expand_details != 'yes'){
		jQuery(document).on('mouseenter mouseleave', '.wrap.slimstat .postbox p:not(.header)', function(){
			jQuery(this).find('.slimstat-row-details').toggleClass('expanded');
		});
	}

	// Modal Window / Overlay: Setup
	if (typeof jQuery('#slimstat-modal-dialog').dialog == 'function'){
		jQuery('#slimstat-modal-dialog').dialog({
			autoOpen: false,
			closeOnEscape: true,
			closeText: '',
			draggable: true,
			modal: true,
			open: function(){
				jQuery('.ui-widget-overlay,.close-dialog').bind('click',function(){
					jQuery('#slimstat-modal-dialog').dialog('close');
				});
			},
			position: { my: "top center" },
			resizable: false
		});
	}

	// Modal Window / Whois
	jQuery(document).on('click', '.whois', function(e){
		e.preventDefault();
		
		// If admin is using HTTPS and IP lookup service is not, open a new window/tab, instead of an overlay dialog
        if (document.location.href.substr(0, document.location.href.indexOf("://")).toLowerCase() == 'https' &&  jQuery(this).attr('href').substr(0, jQuery(this).attr('href').indexOf("://")).toLowerCase() == 'http'){
			window.open(jQuery(this).attr('href'), '_blank');
			return -1;
		}
		
		jQuery('#slimstat-modal-dialog').dialog({
			dialogClass: 'slimstat',
			title: jQuery(this).attr('title')
		}).html('<iframe id="ip2location" src="'+jQuery(this).attr('href')+'" width="100%" height="600"></iframe>');
		jQuery('#slimstat-modal-dialog').dialog('open');
	});

	// Modal Window / Load & Save Filters
	jQuery(document).on('click', '#slimstat-load-saved-filters', function(e){
		e.preventDefault();
		var inner_html = '';
		
		data = {action: 'slimstat_manage_filters', security: jQuery('#meta-box-order-nonce').val(), type: 'load', current_tab: SlimStatAdminParams.current_tab};
		jQuery.ajax({
			url: ajaxurl,
			type: 'post',
			async: false,
			data: data,
			success: function(response){
				inner_html = response;
			}
		});
		
		jQuery('#slimstat-modal-dialog').dialog({
			dialogClass: 'slimstat',
			title: jQuery(this).attr('title')
		}).html(inner_html);
		jQuery('#slimstat-modal-dialog').dialog('open');
	});
	
	jQuery(document).on('click', '#slimstat-save-filter', function(e){
		e.preventDefault();
		
		data = {action: 'slimstat_manage_filters', security: jQuery('#meta-box-order-nonce').val(), type: 'save', filter_array: jQuery(this).attr('data-filter-array')};
		jQuery.ajax({
			url: ajaxurl,
			type: 'post',
			async: false,
			data: data,
			success: function(response){
				jQuery('#slimstat-save-filter').text(response).fadeOut(1500);
			}
		});
	});
	
	jQuery(document).on('click', '.slimstat-delete-filter', function(e){
		e.preventDefault();

		data = {action: 'slimstat_manage_filters', security: jQuery('#meta-box-order-nonce').val(), type: 'delete', filter_id: jQuery(this).attr('data-filter-id'), current_tab: SlimStatAdminParams.current_tab};
		jQuery.ajax({
			url: ajaxurl,
			type: 'post',
			async: false,
			data: data,
			success: function(response){
				jQuery('#slim_filters_overlay').parent().html(response);
			}
		});
	});

	// Redraw charts and adjust modal window width on resize
	SlimStatAdmin.chart_init();
	jQuery(window).resize(function(){
		SlimStatAdmin.chart_init();
	});

	// Remove click on report title
	jQuery('h3.hndle').on('click', function(){ jQuery(this).parent().toggleClass('closed') });
});

/* SlimScroll v1.3.3 | http://rocha.la | Copyright (c) 2011 Piotr Rochala. Licensed MIT, GPL. */
(function(e){e.fn.extend({slimScroll:function(n){var r={width:"auto",height:"250px",size:"7px",color:"#000",position:"right",distance:"1px",start:"top",opacity:.4,alwaysVisible:false,disableFadeOut:false,railVisible:false,railColor:"#333",railOpacity:.2,railDraggable:true,railClass:"slimScrollRail",barClass:"slimScrollBar",wrapperClass:"slimScrollDiv",allowPageScroll:false,wheelStep:20,touchScrollStep:200,borderRadius:"7px",railBorderRadius:"7px"};var i=e.extend(r,n);this.each(function(){function x(t){if(!r){return}var t=t||window.event;var n=0;if(t.wheelDelta){n=-t.wheelDelta/120}if(t.detail){n=t.detail/3}var s=t.target||t.srcTarget||t.srcElement;if(e(s).closest("."+i.wrapperClass).is(m.parent())){T(n,true)}if(t.preventDefault&&!v){t.preventDefault()}if(!v){t.returnValue=false}}function T(e,t,n){v=false;var r=e;var s=m.outerHeight()-E.outerHeight();if(t){r=parseInt(E.css("top"))+e*parseInt(i.wheelStep)/100*E.outerHeight();r=Math.min(Math.max(r,0),s);r=e>0?Math.ceil(r):Math.floor(r);E.css({top:r+"px"})}c=parseInt(E.css("top"))/(m.outerHeight()-E.outerHeight());r=c*(m[0].scrollHeight-m.outerHeight());if(n){r=e;var u=r/m[0].scrollHeight*m.outerHeight();u=Math.min(Math.max(u,0),s);E.css({top:u+"px"})}m.scrollTop(r);m.trigger("slimscrolling",~~r);k();L()}function N(){if(window.addEventListener){this.addEventListener("DOMMouseScroll",x,false);this.addEventListener("mousewheel",x,false)}else{document.attachEvent("onmousewheel",x)}}function C(){l=Math.max(m.outerHeight()/m[0].scrollHeight*m.outerHeight(),d);E.css({height:l+"px"});var e=l==m.outerHeight()?"none":"block";E.css({display:e})}function k(){C();clearTimeout(a);if(c==~~c){v=i.allowPageScroll;if(h!=c){var e=~~c==0?"top":"bottom";m.trigger("slimscroll",e)}}else{v=false}h=c;if(l>=m.outerHeight()){v=true;return}E.stop(true,true).fadeIn("fast");if(i.railVisible){w.stop(true,true).fadeIn("fast")}}function L(){if(!i.alwaysVisible){a=setTimeout(function(){if(!(i.disableFadeOut&&r)&&!s&&!u){E.fadeOut("slow");w.fadeOut("slow")}},1e3)}}var r,s,u,a,f,l,c,h,p="<div></div>",d=30,v=false;var m=e(this);if(m.parent().hasClass(i.wrapperClass)){var g=m.scrollTop();E=m.parent().find("."+i.barClass);w=m.parent().find("."+i.railClass);C();if(e.isPlainObject(n)){if("height"in n&&n.height=="auto"){m.parent().css("height","auto");m.css("height","auto");var y=m.parent().parent().height();m.parent().css("height",y);m.css("height",y)}if("scrollTo"in n){g=parseInt(i.scrollTo)}else if("scrollBy"in n){g+=parseInt(i.scrollBy)}else if("destroy"in n){E.remove();w.remove();m.unwrap();return}T(g,false,true)}return}else if(e.isPlainObject(n)){if("destroy"in n){return}}i.height=i.height=="auto"?m.parent().height():i.height;var b=e(p).addClass(i.wrapperClass).css({position:"relative",overflow:"hidden",width:i.width,height:i.height});m.css({overflow:"hidden",width:i.width,height:i.height});var w=e(p).addClass(i.railClass).css({width:i.size,height:"100%",position:"absolute",top:0,display:i.alwaysVisible&&i.railVisible?"block":"none","border-radius":i.railBorderRadius,background:i.railColor,opacity:i.railOpacity,zIndex:90});var E=e(p).addClass(i.barClass).css({background:i.color,width:i.size,position:"absolute",top:0,opacity:i.opacity,display:i.alwaysVisible?"block":"none","border-radius":i.borderRadius,BorderRadius:i.borderRadius,MozBorderRadius:i.borderRadius,WebkitBorderRadius:i.borderRadius,zIndex:99});var S=i.position=="right"?{right:i.distance}:{left:i.distance};w.css(S);E.css(S);m.wrap(b);m.parent().append(E);m.parent().append(w);if(i.railDraggable){E.bind("mousedown",function(n){var r=e(document);u=true;t=parseFloat(E.css("top"));pageY=n.pageY;r.bind("mousemove.slimscroll",function(e){currTop=t+e.pageY-pageY;E.css("top",currTop);T(0,E.position().top,false)});r.bind("mouseup.slimscroll",function(e){u=false;L();r.unbind(".slimscroll")});return false}).bind("selectstart.slimscroll",function(e){e.stopPropagation();e.preventDefault();return false})}w.hover(function(){k()},function(){L()});E.hover(function(){s=true},function(){s=false});m.hover(function(){r=true;k();L()},function(){r=false;L()});m.bind("touchstart",function(e,t){if(e.originalEvent.touches.length){f=e.originalEvent.touches[0].pageY}});m.bind("touchmove",function(e){if(!v){e.originalEvent.preventDefault()}if(e.originalEvent.touches.length){var t=(f-e.originalEvent.touches[0].pageY)/i.touchScrollStep;T(t,true);f=e.originalEvent.touches[0].pageY}});C();if(i.start==="bottom"){E.css({top:m.outerHeight()-E.outerHeight()});T(0,true)}else if(i.start!=="top"){T(e(i.start).position().top,null,true);if(!i.alwaysVisible){E.hide()}}N()});return this}});e.fn.extend({slimscroll:e.fn.slimScroll})})(jQuery);

/* qTip2 v2.2.1 | http://qtip2.com | Licensed MIT, GPL. */
!function(a,b,c){!function(a){"use strict";"function"==typeof define&&define.amd?define(["jquery"],a):jQuery&&!jQuery.fn.qtip&&a(jQuery)}(function(d){"use strict";function e(a,b,c,e){this.id=c,this.target=a,this.tooltip=z,this.elements={target:a},this._id=M+"-"+c,this.timers={img:{}},this.options=b,this.plugins={},this.cache={event:{},target:d(),disabled:y,attr:e,onTooltip:y,lastClass:""},this.rendered=this.destroyed=this.disabled=this.waiting=this.hiddenDuringWait=this.positioning=this.triggering=y}function f(a){return a===z||"object"!==d.type(a)}function g(a){return!(d.isFunction(a)||a&&a.attr||a.length||"object"===d.type(a)&&(a.jquery||a.then))}function h(a){var b,c,e,h;return f(a)?y:(f(a.metadata)&&(a.metadata={type:a.metadata}),"content"in a&&(b=a.content,f(b)||b.jquery||b.done?b=a.content={text:c=g(b)?y:b}:c=b.text,"ajax"in b&&(e=b.ajax,h=e&&e.once!==y,delete b.ajax,b.text=function(a,b){var f=c||d(this).attr(b.options.content.attr)||"Loading...",g=d.ajax(d.extend({},e,{context:b})).then(e.success,z,e.error).then(function(a){return a&&h&&b.set("content.text",a),a},function(a,c,d){b.destroyed||0===a.status||b.set("content.text",c+": "+d)});return h?f:(b.set("content.text",f),g)}),"title"in b&&(d.isPlainObject(b.title)&&(b.button=b.title.button,b.title=b.title.text),g(b.title||y)&&(b.title=y))),"position"in a&&f(a.position)&&(a.position={my:a.position,at:a.position}),"show"in a&&f(a.show)&&(a.show=a.show.jquery?{target:a.show}:a.show===x?{ready:x}:{event:a.show}),"hide"in a&&f(a.hide)&&(a.hide=a.hide.jquery?{target:a.hide}:{event:a.hide}),"style"in a&&f(a.style)&&(a.style={classes:a.style}),d.each(L,function(){this.sanitize&&this.sanitize(a)}),a)}function i(a,b){for(var c,d=0,e=a,f=b.split(".");e=e[f[d++]];)d<f.length&&(c=e);return[c||a,f.pop()]}function j(a,b){var c,d,e;for(c in this.checks)for(d in this.checks[c])(e=new RegExp(d,"i").exec(a))&&(b.push(e),("builtin"===c||this.plugins[c])&&this.checks[c][d].apply(this.plugins[c]||this,b))}function k(a){return P.concat("").join(a?"-"+a+" ":" ")}function l(a,b){return b>0?setTimeout(d.proxy(a,this),b):void a.call(this)}function m(a){this.tooltip.hasClass(W)||(clearTimeout(this.timers.show),clearTimeout(this.timers.hide),this.timers.show=l.call(this,function(){this.toggle(x,a)},this.options.show.delay))}function n(a){if(!this.tooltip.hasClass(W)&&!this.destroyed){var b=d(a.relatedTarget),c=b.closest(Q)[0]===this.tooltip[0],e=b[0]===this.options.show.target[0];if(clearTimeout(this.timers.show),clearTimeout(this.timers.hide),this!==b[0]&&"mouse"===this.options.position.target&&c||this.options.hide.fixed&&/mouse(out|leave|move)/.test(a.type)&&(c||e))try{a.preventDefault(),a.stopImmediatePropagation()}catch(f){}else this.timers.hide=l.call(this,function(){this.toggle(y,a)},this.options.hide.delay,this)}}function o(a){!this.tooltip.hasClass(W)&&this.options.hide.inactive&&(clearTimeout(this.timers.inactive),this.timers.inactive=l.call(this,function(){this.hide(a)},this.options.hide.inactive))}function p(a){this.rendered&&this.tooltip[0].offsetWidth>0&&this.reposition(a)}function q(a,c,e){d(b.body).delegate(a,(c.split?c:c.join("."+M+" "))+"."+M,function(){var a=s.api[d.attr(this,O)];a&&!a.disabled&&e.apply(a,arguments)})}function r(a,c,f){var g,i,j,k,l,m=d(b.body),n=a[0]===b?m:a,o=a.metadata?a.metadata(f.metadata):z,p="html5"===f.metadata.type&&o?o[f.metadata.name]:z,q=a.data(f.metadata.name||"qtipopts");try{q="string"==typeof q?d.parseJSON(q):q}catch(r){}if(k=d.extend(x,{},s.defaults,f,"object"==typeof q?h(q):z,h(p||o)),i=k.position,k.id=c,"boolean"==typeof k.content.text){if(j=a.attr(k.content.attr),k.content.attr===y||!j)return y;k.content.text=j}if(i.container.length||(i.container=m),i.target===y&&(i.target=n),k.show.target===y&&(k.show.target=n),k.show.solo===x&&(k.show.solo=i.container.closest("body")),k.hide.target===y&&(k.hide.target=n),k.position.viewport===x&&(k.position.viewport=i.container),i.container=i.container.eq(0),i.at=new u(i.at,x),i.my=new u(i.my),a.data(M))if(k.overwrite)a.qtip("destroy",!0);else if(k.overwrite===y)return y;return a.attr(N,c),k.suppress&&(l=a.attr("title"))&&a.removeAttr("title").attr(Y,l).attr("title",""),g=new e(a,k,c,!!j),a.data(M,g),g}var s,t,u,v,w,x=!0,y=!1,z=null,A="x",B="y",C="width",D="height",E="top",F="left",G="bottom",H="right",I="center",J="flipinvert",K="shift",L={},M="qtip",N="data-hasqtip",O="data-qtip-id",P=["ui-widget","ui-tooltip"],Q="."+M,R="click dblclick mousedown mouseup mousemove mouseleave mouseenter".split(" "),S=M+"-fixed",T=M+"-default",U=M+"-focus",V=M+"-hover",W=M+"-disabled",X="_replacedByqTip",Y="oldtitle",Z={ie:function(){for(var a=4,c=b.createElement("div");(c.innerHTML="<!--[if gt IE "+a+"]><i></i><![endif]-->")&&c.getElementsByTagName("i")[0];a+=1);return a>4?a:0/0}(),iOS:parseFloat((""+(/CPU.*OS ([0-9_]{1,5})|(CPU like).*AppleWebKit.*Mobile/i.exec(navigator.userAgent)||[0,""])[1]).replace("undefined","3_2").replace("_",".").replace("_",""))||y};t=e.prototype,t._when=function(a){return d.when.apply(d,a)},t.render=function(a){if(this.rendered||this.destroyed)return this;var b,c=this,e=this.options,f=this.cache,g=this.elements,h=e.content.text,i=e.content.title,j=e.content.button,k=e.position,l=("."+this._id+" ",[]);return d.attr(this.target[0],"aria-describedby",this._id),f.posClass=this._createPosClass((this.position={my:k.my,at:k.at}).my),this.tooltip=g.tooltip=b=d("<div/>",{id:this._id,"class":[M,T,e.style.classes,f.posClass].join(" "),width:e.style.width||"",height:e.style.height||"",tracking:"mouse"===k.target&&k.adjust.mouse,role:"alert","aria-live":"polite","aria-atomic":y,"aria-describedby":this._id+"-content","aria-hidden":x}).toggleClass(W,this.disabled).attr(O,this.id).data(M,this).appendTo(k.container).append(g.content=d("<div />",{"class":M+"-content",id:this._id+"-content","aria-atomic":x})),this.rendered=-1,this.positioning=x,i&&(this._createTitle(),d.isFunction(i)||l.push(this._updateTitle(i,y))),j&&this._createButton(),d.isFunction(h)||l.push(this._updateContent(h,y)),this.rendered=x,this._setWidget(),d.each(L,function(a){var b;"render"===this.initialize&&(b=this(c))&&(c.plugins[a]=b)}),this._unassignEvents(),this._assignEvents(),this._when(l).then(function(){c._trigger("render"),c.positioning=y,c.hiddenDuringWait||!e.show.ready&&!a||c.toggle(x,f.event,y),c.hiddenDuringWait=y}),s.api[this.id]=this,this},t.destroy=function(a){function b(){if(!this.destroyed){this.destroyed=x;var a,b=this.target,c=b.attr(Y);this.rendered&&this.tooltip.stop(1,0).find("*").remove().end().remove(),d.each(this.plugins,function(){this.destroy&&this.destroy()});for(a in this.timers)clearTimeout(this.timers[a]);b.removeData(M).removeAttr(O).removeAttr(N).removeAttr("aria-describedby"),this.options.suppress&&c&&b.attr("title",c).removeAttr(Y),this._unassignEvents(),this.options=this.elements=this.cache=this.timers=this.plugins=this.mouse=z,delete s.api[this.id]}}return this.destroyed?this.target:(a===x&&"hide"!==this.triggering||!this.rendered?b.call(this):(this.tooltip.one("tooltiphidden",d.proxy(b,this)),!this.triggering&&this.hide()),this.target)},v=t.checks={builtin:{"^id$":function(a,b,c,e){var f=c===x?s.nextid:c,g=M+"-"+f;f!==y&&f.length>0&&!d("#"+g).length?(this._id=g,this.rendered&&(this.tooltip[0].id=this._id,this.elements.content[0].id=this._id+"-content",this.elements.title[0].id=this._id+"-title")):a[b]=e},"^prerender":function(a,b,c){c&&!this.rendered&&this.render(this.options.show.ready)},"^content.text$":function(a,b,c){this._updateContent(c)},"^content.attr$":function(a,b,c,d){this.options.content.text===this.target.attr(d)&&this._updateContent(this.target.attr(c))},"^content.title$":function(a,b,c){return c?(c&&!this.elements.title&&this._createTitle(),void this._updateTitle(c)):this._removeTitle()},"^content.button$":function(a,b,c){this._updateButton(c)},"^content.title.(text|button)$":function(a,b,c){this.set("content."+b,c)},"^position.(my|at)$":function(a,b,c){"string"==typeof c&&(this.position[b]=a[b]=new u(c,"at"===b))},"^position.container$":function(a,b,c){this.rendered&&this.tooltip.appendTo(c)},"^show.ready$":function(a,b,c){c&&(!this.rendered&&this.render(x)||this.toggle(x))},"^style.classes$":function(a,b,c,d){this.rendered&&this.tooltip.removeClass(d).addClass(c)},"^style.(width|height)":function(a,b,c){this.rendered&&this.tooltip.css(b,c)},"^style.widget|content.title":function(){this.rendered&&this._setWidget()},"^style.def":function(a,b,c){this.rendered&&this.tooltip.toggleClass(T,!!c)},"^events.(render|show|move|hide|focus|blur)$":function(a,b,c){this.rendered&&this.tooltip[(d.isFunction(c)?"":"un")+"bind"]("tooltip"+b,c)},"^(show|hide|position).(event|target|fixed|inactive|leave|distance|viewport|adjust)":function(){if(this.rendered){var a=this.options.position;this.tooltip.attr("tracking","mouse"===a.target&&a.adjust.mouse),this._unassignEvents(),this._assignEvents()}}}},t.get=function(a){if(this.destroyed)return this;var b=i(this.options,a.toLowerCase()),c=b[0][b[1]];return c.precedance?c.string():c};var $=/^position\.(my|at|adjust|target|container|viewport)|style|content|show\.ready/i,_=/^prerender|show\.ready/i;t.set=function(a,b){if(this.destroyed)return this;{var c,e=this.rendered,f=y,g=this.options;this.checks}return"string"==typeof a?(c=a,a={},a[c]=b):a=d.extend({},a),d.each(a,function(b,c){if(e&&_.test(b))return void delete a[b];var h,j=i(g,b.toLowerCase());h=j[0][j[1]],j[0][j[1]]=c&&c.nodeType?d(c):c,f=$.test(b)||f,a[b]=[j[0],j[1],c,h]}),h(g),this.positioning=x,d.each(a,d.proxy(j,this)),this.positioning=y,this.rendered&&this.tooltip[0].offsetWidth>0&&f&&this.reposition("mouse"===g.position.target?z:this.cache.event),this},t._update=function(a,b){var c=this,e=this.cache;return this.rendered&&a?(d.isFunction(a)&&(a=a.call(this.elements.target,e.event,this)||""),d.isFunction(a.then)?(e.waiting=x,a.then(function(a){return e.waiting=y,c._update(a,b)},z,function(a){return c._update(a,b)})):a===y||!a&&""!==a?y:(a.jquery&&a.length>0?b.empty().append(a.css({display:"block",visibility:"visible"})):b.html(a),this._waitForContent(b).then(function(a){c.rendered&&c.tooltip[0].offsetWidth>0&&c.reposition(e.event,!a.length)}))):y},t._waitForContent=function(a){var b=this.cache;return b.waiting=x,(d.fn.imagesLoaded?a.imagesLoaded():d.Deferred().resolve([])).done(function(){b.waiting=y}).promise()},t._updateContent=function(a,b){this._update(a,this.elements.content,b)},t._updateTitle=function(a,b){this._update(a,this.elements.title,b)===y&&this._removeTitle(y)},t._createTitle=function(){var a=this.elements,b=this._id+"-title";a.titlebar&&this._removeTitle(),a.titlebar=d("<div />",{"class":M+"-titlebar "+(this.options.style.widget?k("header"):"")}).append(a.title=d("<div />",{id:b,"class":M+"-title","aria-atomic":x})).insertBefore(a.content).delegate(".qtip-close","mousedown keydown mouseup keyup mouseout",function(a){d(this).toggleClass("ui-state-active ui-state-focus","down"===a.type.substr(-4))}).delegate(".qtip-close","mouseover mouseout",function(a){d(this).toggleClass("ui-state-hover","mouseover"===a.type)}),this.options.content.button&&this._createButton()},t._removeTitle=function(a){var b=this.elements;b.title&&(b.titlebar.remove(),b.titlebar=b.title=b.button=z,a!==y&&this.reposition())},t._createPosClass=function(a){return M+"-pos-"+(a||this.options.position.my).abbrev()},t.reposition=function(c,e){if(!this.rendered||this.positioning||this.destroyed)return this;this.positioning=x;var f,g,h,i,j=this.cache,k=this.tooltip,l=this.options.position,m=l.target,n=l.my,o=l.at,p=l.viewport,q=l.container,r=l.adjust,s=r.method.split(" "),t=k.outerWidth(y),u=k.outerHeight(y),v=0,w=0,z=k.css("position"),A={left:0,top:0},B=k[0].offsetWidth>0,C=c&&"scroll"===c.type,D=d(a),J=q[0].ownerDocument,K=this.mouse;if(d.isArray(m)&&2===m.length)o={x:F,y:E},A={left:m[0],top:m[1]};else if("mouse"===m)o={x:F,y:E},(!r.mouse||this.options.hide.distance)&&j.origin&&j.origin.pageX?c=j.origin:!c||c&&("resize"===c.type||"scroll"===c.type)?c=j.event:K&&K.pageX&&(c=K),"static"!==z&&(A=q.offset()),J.body.offsetWidth!==(a.innerWidth||J.documentElement.clientWidth)&&(g=d(b.body).offset()),A={left:c.pageX-A.left+(g&&g.left||0),top:c.pageY-A.top+(g&&g.top||0)},r.mouse&&C&&K&&(A.left-=(K.scrollX||0)-D.scrollLeft(),A.top-=(K.scrollY||0)-D.scrollTop());else{if("event"===m?c&&c.target&&"scroll"!==c.type&&"resize"!==c.type?j.target=d(c.target):c.target||(j.target=this.elements.target):"event"!==m&&(j.target=d(m.jquery?m:this.elements.target)),m=j.target,m=d(m).eq(0),0===m.length)return this;m[0]===b||m[0]===a?(v=Z.iOS?a.innerWidth:m.width(),w=Z.iOS?a.innerHeight:m.height(),m[0]===a&&(A={top:(p||m).scrollTop(),left:(p||m).scrollLeft()})):L.imagemap&&m.is("area")?f=L.imagemap(this,m,o,L.viewport?s:y):L.svg&&m&&m[0].ownerSVGElement?f=L.svg(this,m,o,L.viewport?s:y):(v=m.outerWidth(y),w=m.outerHeight(y),A=m.offset()),f&&(v=f.width,w=f.height,g=f.offset,A=f.position),A=this.reposition.offset(m,A,q),(Z.iOS>3.1&&Z.iOS<4.1||Z.iOS>=4.3&&Z.iOS<4.33||!Z.iOS&&"fixed"===z)&&(A.left-=D.scrollLeft(),A.top-=D.scrollTop()),(!f||f&&f.adjustable!==y)&&(A.left+=o.x===H?v:o.x===I?v/2:0,A.top+=o.y===G?w:o.y===I?w/2:0)}return A.left+=r.x+(n.x===H?-t:n.x===I?-t/2:0),A.top+=r.y+(n.y===G?-u:n.y===I?-u/2:0),L.viewport?(h=A.adjusted=L.viewport(this,A,l,v,w,t,u),g&&h.left&&(A.left+=g.left),g&&h.top&&(A.top+=g.top),h.my&&(this.position.my=h.my)):A.adjusted={left:0,top:0},j.posClass!==(i=this._createPosClass(this.position.my))&&k.removeClass(j.posClass).addClass(j.posClass=i),this._trigger("move",[A,p.elem||p],c)?(delete A.adjusted,e===y||!B||isNaN(A.left)||isNaN(A.top)||"mouse"===m||!d.isFunction(l.effect)?k.css(A):d.isFunction(l.effect)&&(l.effect.call(k,this,d.extend({},A)),k.queue(function(a){d(this).css({opacity:"",height:""}),Z.ie&&this.style.removeAttribute("filter"),a()})),this.positioning=y,this):this},t.reposition.offset=function(a,c,e){function f(a,b){c.left+=b*a.scrollLeft(),c.top+=b*a.scrollTop()}if(!e[0])return c;var g,h,i,j,k=d(a[0].ownerDocument),l=!!Z.ie&&"CSS1Compat"!==b.compatMode,m=e[0];do"static"!==(h=d.css(m,"position"))&&("fixed"===h?(i=m.getBoundingClientRect(),f(k,-1)):(i=d(m).position(),i.left+=parseFloat(d.css(m,"borderLeftWidth"))||0,i.top+=parseFloat(d.css(m,"borderTopWidth"))||0),c.left-=i.left+(parseFloat(d.css(m,"marginLeft"))||0),c.top-=i.top+(parseFloat(d.css(m,"marginTop"))||0),g||"hidden"===(j=d.css(m,"overflow"))||"visible"===j||(g=d(m)));while(m=m.offsetParent);return g&&(g[0]!==k[0]||l)&&f(g,1),c};var ab=(u=t.reposition.Corner=function(a,b){a=(""+a).replace(/([A-Z])/," $1").replace(/middle/gi,I).toLowerCase(),this.x=(a.match(/left|right/i)||a.match(/center/)||["inherit"])[0].toLowerCase(),this.y=(a.match(/top|bottom|center/i)||["inherit"])[0].toLowerCase(),this.forceY=!!b;var c=a.charAt(0);this.precedance="t"===c||"b"===c?B:A}).prototype;ab.invert=function(a,b){this[a]=this[a]===F?H:this[a]===H?F:b||this[a]},ab.string=function(a){var b=this.x,c=this.y,d=b!==c?"center"===b||"center"!==c&&(this.precedance===B||this.forceY)?[c,b]:[b,c]:[b];return a!==!1?d.join(" "):d},ab.abbrev=function(){var a=this.string(!1);return a[0].charAt(0)+(a[1]&&a[1].charAt(0)||"")},ab.clone=function(){return new u(this.string(),this.forceY)},t.toggle=function(a,c){var e=this.cache,f=this.options,g=this.tooltip;if(c){if(/over|enter/.test(c.type)&&e.event&&/out|leave/.test(e.event.type)&&f.show.target.add(c.target).length===f.show.target.length&&g.has(c.relatedTarget).length)return this;e.event=d.event.fix(c)}if(this.waiting&&!a&&(this.hiddenDuringWait=x),!this.rendered)return a?this.render(1):this;if(this.destroyed||this.disabled)return this;var h,i,j,k=a?"show":"hide",l=this.options[k],m=(this.options[a?"hide":"show"],this.options.position),n=this.options.content,o=this.tooltip.css("width"),p=this.tooltip.is(":visible"),q=a||1===l.target.length,r=!c||l.target.length<2||e.target[0]===c.target;return(typeof a).search("boolean|number")&&(a=!p),h=!g.is(":animated")&&p===a&&r,i=h?z:!!this._trigger(k,[90]),this.destroyed?this:(i!==y&&a&&this.focus(c),!i||h?this:(d.attr(g[0],"aria-hidden",!a),a?(this.mouse&&(e.origin=d.event.fix(this.mouse)),d.isFunction(n.text)&&this._updateContent(n.text,y),d.isFunction(n.title)&&this._updateTitle(n.title,y),!w&&"mouse"===m.target&&m.adjust.mouse&&(d(b).bind("mousemove."+M,this._storeMouse),w=x),o||g.css("width",g.outerWidth(y)),this.reposition(c,arguments[2]),o||g.css("width",""),l.solo&&("string"==typeof l.solo?d(l.solo):d(Q,l.solo)).not(g).not(l.target).qtip("hide",d.Event("tooltipsolo"))):(clearTimeout(this.timers.show),delete e.origin,w&&!d(Q+'[tracking="true"]:visible',l.solo).not(g).length&&(d(b).unbind("mousemove."+M),w=y),this.blur(c)),j=d.proxy(function(){a?(Z.ie&&g[0].style.removeAttribute("filter"),g.css("overflow",""),"string"==typeof l.autofocus&&d(this.options.show.autofocus,g).focus(),this.options.show.target.trigger("qtip-"+this.id+"-inactive")):g.css({display:"",visibility:"",opacity:"",left:"",top:""}),this._trigger(a?"visible":"hidden")},this),l.effect===y||q===y?(g[k](),j()):d.isFunction(l.effect)?(g.stop(1,1),l.effect.call(g,this),g.queue("fx",function(a){j(),a()})):g.fadeTo(90,a?1:0,j),a&&l.target.trigger("qtip-"+this.id+"-inactive"),this))},t.show=function(a){return this.toggle(x,a)},t.hide=function(a){return this.toggle(y,a)},t.focus=function(a){if(!this.rendered||this.destroyed)return this;var b=d(Q),c=this.tooltip,e=parseInt(c[0].style.zIndex,10),f=s.zindex+b.length;return c.hasClass(U)||this._trigger("focus",[f],a)&&(e!==f&&(b.each(function(){this.style.zIndex>e&&(this.style.zIndex=this.style.zIndex-1)}),b.filter("."+U).qtip("blur",a)),c.addClass(U)[0].style.zIndex=f),this},t.blur=function(a){return!this.rendered||this.destroyed?this:(this.tooltip.removeClass(U),this._trigger("blur",[this.tooltip.css("zIndex")],a),this)},t.disable=function(a){return this.destroyed?this:("toggle"===a?a=!(this.rendered?this.tooltip.hasClass(W):this.disabled):"boolean"!=typeof a&&(a=x),this.rendered&&this.tooltip.toggleClass(W,a).attr("aria-disabled",a),this.disabled=!!a,this)},t.enable=function(){return this.disable(y)},t._createButton=function(){var a=this,b=this.elements,c=b.tooltip,e=this.options.content.button,f="string"==typeof e,g=f?e:"Close tooltip";b.button&&b.button.remove(),b.button=e.jquery?e:d("<a />",{"class":"qtip-close "+(this.options.style.widget?"":M+"-icon"),title:g,"aria-label":g}).prepend(d("<span />",{"class":"ui-icon ui-icon-close",html:"&times;"})),b.button.appendTo(b.titlebar||c).attr("role","button").click(function(b){return c.hasClass(W)||a.hide(b),y})},t._updateButton=function(a){if(!this.rendered)return y;var b=this.elements.button;a?this._createButton():b.remove()},t._setWidget=function(){var a=this.options.style.widget,b=this.elements,c=b.tooltip,d=c.hasClass(W);c.removeClass(W),W=a?"ui-state-disabled":"qtip-disabled",c.toggleClass(W,d),c.toggleClass("ui-helper-reset "+k(),a).toggleClass(T,this.options.style.def&&!a),b.content&&b.content.toggleClass(k("content"),a),b.titlebar&&b.titlebar.toggleClass(k("header"),a),b.button&&b.button.toggleClass(M+"-icon",!a)},t._storeMouse=function(a){return(this.mouse=d.event.fix(a)).type="mousemove",this},t._bind=function(a,b,c,e,f){if(a&&c&&b.length){var g="."+this._id+(e?"-"+e:"");return d(a).bind((b.split?b:b.join(g+" "))+g,d.proxy(c,f||this)),this}},t._unbind=function(a,b){return a&&d(a).unbind("."+this._id+(b?"-"+b:"")),this},t._trigger=function(a,b,c){var e=d.Event("tooltip"+a);return e.originalEvent=c&&d.extend({},c)||this.cache.event||z,this.triggering=a,this.tooltip.trigger(e,[this].concat(b||[])),this.triggering=y,!e.isDefaultPrevented()},t._bindEvents=function(a,b,c,e,f,g){var h=c.filter(e).add(e.filter(c)),i=[];h.length&&(d.each(b,function(b,c){var e=d.inArray(c,a);e>-1&&i.push(a.splice(e,1)[0])}),i.length&&(this._bind(h,i,function(a){var b=this.rendered?this.tooltip[0].offsetWidth>0:!1;(b?g:f).call(this,a)}),c=c.not(h),e=e.not(h))),this._bind(c,a,f),this._bind(e,b,g)},t._assignInitialEvents=function(a){function b(a){return this.disabled||this.destroyed?y:(this.cache.event=a&&d.event.fix(a),this.cache.target=a&&d(a.target),clearTimeout(this.timers.show),void(this.timers.show=l.call(this,function(){this.render("object"==typeof a||c.show.ready)},c.prerender?0:c.show.delay)))}var c=this.options,e=c.show.target,f=c.hide.target,g=c.show.event?d.trim(""+c.show.event).split(" "):[],h=c.hide.event?d.trim(""+c.hide.event).split(" "):[];this._bind(this.elements.target,["remove","removeqtip"],function(){this.destroy(!0)},"destroy"),/mouse(over|enter)/i.test(c.show.event)&&!/mouse(out|leave)/i.test(c.hide.event)&&h.push("mouseleave"),this._bind(e,"mousemove",function(a){this._storeMouse(a),this.cache.onTarget=x}),this._bindEvents(g,h,e,f,b,function(){return this.timers?void clearTimeout(this.timers.show):y}),(c.show.ready||c.prerender)&&b.call(this,a)},t._assignEvents=function(){var c=this,e=this.options,f=e.position,g=this.tooltip,h=e.show.target,i=e.hide.target,j=f.container,k=f.viewport,l=d(b),q=(d(b.body),d(a)),r=e.show.event?d.trim(""+e.show.event).split(" "):[],t=e.hide.event?d.trim(""+e.hide.event).split(" "):[];d.each(e.events,function(a,b){c._bind(g,"toggle"===a?["tooltipshow","tooltiphide"]:["tooltip"+a],b,null,g)}),/mouse(out|leave)/i.test(e.hide.event)&&"window"===e.hide.leave&&this._bind(l,["mouseout","blur"],function(a){/select|option/.test(a.target.nodeName)||a.relatedTarget||this.hide(a)}),e.hide.fixed?i=i.add(g.addClass(S)):/mouse(over|enter)/i.test(e.show.event)&&this._bind(i,"mouseleave",function(){clearTimeout(this.timers.show)}),(""+e.hide.event).indexOf("unfocus")>-1&&this._bind(j.closest("html"),["mousedown","touchstart"],function(a){var b=d(a.target),c=this.rendered&&!this.tooltip.hasClass(W)&&this.tooltip[0].offsetWidth>0,e=b.parents(Q).filter(this.tooltip[0]).length>0;b[0]===this.target[0]||b[0]===this.tooltip[0]||e||this.target.has(b[0]).length||!c||this.hide(a)}),"number"==typeof e.hide.inactive&&(this._bind(h,"qtip-"+this.id+"-inactive",o,"inactive"),this._bind(i.add(g),s.inactiveEvents,o)),this._bindEvents(r,t,h,i,m,n),this._bind(h.add(g),"mousemove",function(a){if("number"==typeof e.hide.distance){var b=this.cache.origin||{},c=this.options.hide.distance,d=Math.abs;(d(a.pageX-b.pageX)>=c||d(a.pageY-b.pageY)>=c)&&this.hide(a)}this._storeMouse(a)}),"mouse"===f.target&&f.adjust.mouse&&(e.hide.event&&this._bind(h,["mouseenter","mouseleave"],function(a){return this.cache?void(this.cache.onTarget="mouseenter"===a.type):y}),this._bind(l,"mousemove",function(a){this.rendered&&this.cache.onTarget&&!this.tooltip.hasClass(W)&&this.tooltip[0].offsetWidth>0&&this.reposition(a)})),(f.adjust.resize||k.length)&&this._bind(d.event.special.resize?k:q,"resize",p),f.adjust.scroll&&this._bind(q.add(f.container),"scroll",p)},t._unassignEvents=function(){var c=this.options,e=c.show.target,f=c.hide.target,g=d.grep([this.elements.target[0],this.rendered&&this.tooltip[0],c.position.container[0],c.position.viewport[0],c.position.container.closest("html")[0],a,b],function(a){return"object"==typeof a});e&&e.toArray&&(g=g.concat(e.toArray())),f&&f.toArray&&(g=g.concat(f.toArray())),this._unbind(g)._unbind(g,"destroy")._unbind(g,"inactive")},d(function(){q(Q,["mouseenter","mouseleave"],function(a){var b="mouseenter"===a.type,c=d(a.currentTarget),e=d(a.relatedTarget||a.target),f=this.options;b?(this.focus(a),c.hasClass(S)&&!c.hasClass(W)&&clearTimeout(this.timers.hide)):"mouse"===f.position.target&&f.position.adjust.mouse&&f.hide.event&&f.show.target&&!e.closest(f.show.target[0]).length&&this.hide(a),c.toggleClass(V,b)}),q("["+O+"]",R,o)}),s=d.fn.qtip=function(a,b,e){var f=(""+a).toLowerCase(),g=z,i=d.makeArray(arguments).slice(1),j=i[i.length-1],k=this[0]?d.data(this[0],M):z;return!arguments.length&&k||"api"===f?k:"string"==typeof a?(this.each(function(){var a=d.data(this,M);if(!a)return x;if(j&&j.timeStamp&&(a.cache.event=j),!b||"option"!==f&&"options"!==f)a[f]&&a[f].apply(a,i);else{if(e===c&&!d.isPlainObject(b))return g=a.get(b),y;a.set(b,e)}}),g!==z?g:this):"object"!=typeof a&&arguments.length?void 0:(k=h(d.extend(x,{},a)),this.each(function(a){var b,c;return c=d.isArray(k.id)?k.id[a]:k.id,c=!c||c===y||c.length<1||s.api[c]?s.nextid++:c,b=r(d(this),c,k),b===y?x:(s.api[c]=b,d.each(L,function(){"initialize"===this.initialize&&this(b)}),void b._assignInitialEvents(j))}))},d.qtip=e,s.api={},d.each({attr:function(a,b){if(this.length){var c=this[0],e="title",f=d.data(c,"qtip");if(a===e&&f&&"object"==typeof f&&f.options.suppress)return arguments.length<2?d.attr(c,Y):(f&&f.options.content.attr===e&&f.cache.attr&&f.set("content.text",b),this.attr(Y,b))}return d.fn["attr"+X].apply(this,arguments)},clone:function(a){var b=(d([]),d.fn["clone"+X].apply(this,arguments));return a||b.filter("["+Y+"]").attr("title",function(){return d.attr(this,Y)}).removeAttr(Y),b}},function(a,b){if(!b||d.fn[a+X])return x;var c=d.fn[a+X]=d.fn[a];d.fn[a]=function(){return b.apply(this,arguments)||c.apply(this,arguments)}}),d.ui||(d["cleanData"+X]=d.cleanData,d.cleanData=function(a){for(var b,c=0;(b=d(a[c])).length;c++)if(b.attr(N))try{b.triggerHandler("removeqtip")}catch(e){}d["cleanData"+X].apply(this,arguments)}),s.version="2.2.1",s.nextid=0,s.inactiveEvents=R,s.zindex=15e3,s.defaults={prerender:y,id:y,overwrite:x,suppress:x,content:{text:x,attr:"title",title:y,button:y},position:{my:"top left",at:"bottom right",target:y,container:y,viewport:y,adjust:{x:0,y:0,mouse:x,scroll:x,resize:x,method:"flipinvert flipinvert"},effect:function(a,b){d(this).animate(b,{duration:200,queue:y})}},show:{target:y,event:"mouseenter",effect:x,delay:90,solo:y,ready:y,autofocus:y},hide:{target:y,event:"mouseleave",effect:x,delay:0,fixed:y,inactive:y,leave:"window",distance:y},style:{classes:"",widget:y,width:y,height:y,def:x},events:{render:z,move:z,show:z,hide:z,toggle:z,visible:z,hidden:z,focus:z,blur:z}},L.viewport=function(c,d,e,f,g,h,i){function j(a,b,c,e,f,g,h,i,j){var k=d[f],s=u[a],t=v[a],w=c===K,x=s===f?j:s===g?-j:-j/2,y=t===f?i:t===g?-i:-i/2,z=q[f]+r[f]-(n?0:m[f]),A=z-k,B=k+j-(h===C?o:p)-z,D=x-(u.precedance===a||s===u[b]?y:0)-(t===I?i/2:0);return w?(D=(s===f?1:-1)*x,d[f]+=A>0?A:B>0?-B:0,d[f]=Math.max(-m[f]+r[f],k-D,Math.min(Math.max(-m[f]+r[f]+(h===C?o:p),k+D),d[f],"center"===s?k-x:1e9))):(e*=c===J?2:0,A>0&&(s!==f||B>0)?(d[f]-=D+e,l.invert(a,f)):B>0&&(s!==g||A>0)&&(d[f]-=(s===I?-D:D)+e,l.invert(a,g)),d[f]<q&&-d[f]>B&&(d[f]=k,l=u.clone())),d[f]-k}var k,l,m,n,o,p,q,r,s=e.target,t=c.elements.tooltip,u=e.my,v=e.at,w=e.adjust,x=w.method.split(" "),z=x[0],L=x[1]||x[0],M=e.viewport,N=e.container,O=(c.cache,{left:0,top:0});return M.jquery&&s[0]!==a&&s[0]!==b.body&&"none"!==w.method?(m=N.offset()||O,n="static"===N.css("position"),k="fixed"===t.css("position"),o=M[0]===a?M.width():M.outerWidth(y),p=M[0]===a?M.height():M.outerHeight(y),q={left:k?0:M.scrollLeft(),top:k?0:M.scrollTop()},r=M.offset()||O,("shift"!==z||"shift"!==L)&&(l=u.clone()),O={left:"none"!==z?j(A,B,z,w.x,F,H,C,f,h):0,top:"none"!==L?j(B,A,L,w.y,E,G,D,g,i):0,my:l}):O}})}(window,document);

/* flot v0.8.2 | https://github.com/flot/flot | Copyright (c) 2007-2013 IOLA and Ole Laursen. Licensed under the MIT license. */
(function(e){e.color={};e.color.make=function(t,n,r,i){var s={};s.r=t||0;s.g=n||0;s.b=r||0;s.a=i!=null?i:1;s.add=function(e,t){for(var n=0;n<e.length;++n)s[e.charAt(n)]+=t;return s.normalize()};s.scale=function(e,t){for(var n=0;n<e.length;++n)s[e.charAt(n)]*=t;return s.normalize()};s.toString=function(){if(s.a>=1){return"rgb("+[s.r,s.g,s.b].join(",")+")"}else{return"rgba("+[s.r,s.g,s.b,s.a].join(",")+")"}};s.normalize=function(){function e(e,t,n){return t<e?e:t>n?n:t}s.r=e(0,parseInt(s.r),255);s.g=e(0,parseInt(s.g),255);s.b=e(0,parseInt(s.b),255);s.a=e(0,s.a,1);return s};s.clone=function(){return e.color.make(s.r,s.b,s.g,s.a)};return s.normalize()};e.color.extract=function(t,n){var r;do{r=t.css(n).toLowerCase();if(r!=""&&r!="transparent")break;t=t.parent()}while(t.length&&!e.nodeName(t.get(0),"body"));if(r=="rgba(0, 0, 0, 0)")r="transparent";return e.color.parse(r)};e.color.parse=function(n){var r,i=e.color.make;if(r=/rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(n))return i(parseInt(r[1],10),parseInt(r[2],10),parseInt(r[3],10));if(r=/rgba\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*\)/.exec(n))return i(parseInt(r[1],10),parseInt(r[2],10),parseInt(r[3],10),parseFloat(r[4]));if(r=/rgb\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*\)/.exec(n))return i(parseFloat(r[1])*2.55,parseFloat(r[2])*2.55,parseFloat(r[3])*2.55);if(r=/rgba\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*\)/.exec(n))return i(parseFloat(r[1])*2.55,parseFloat(r[2])*2.55,parseFloat(r[3])*2.55,parseFloat(r[4]));if(r=/#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(n))return i(parseInt(r[1],16),parseInt(r[2],16),parseInt(r[3],16));if(r=/#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(n))return i(parseInt(r[1]+r[1],16),parseInt(r[2]+r[2],16),parseInt(r[3]+r[3],16));var s=e.trim(n).toLowerCase();if(s=="transparent")return i(255,255,255,0);else{r=t[s]||[0,0,0];return i(r[0],r[1],r[2])}};var t={aqua:[0,255,255],azure:[240,255,255],beige:[245,245,220],black:[0,0,0],blue:[0,0,255],brown:[165,42,42],cyan:[0,255,255],darkblue:[0,0,139],darkcyan:[0,139,139],darkgrey:[169,169,169],darkgreen:[0,100,0],darkkhaki:[189,183,107],darkmagenta:[139,0,139],darkolivegreen:[85,107,47],darkorange:[255,140,0],darkorchid:[153,50,204],darkred:[139,0,0],darksalmon:[233,150,122],darkviolet:[148,0,211],fuchsia:[255,0,255],gold:[255,215,0],green:[0,128,0],indigo:[75,0,130],khaki:[240,230,140],lightblue:[173,216,230],lightcyan:[224,255,255],lightgreen:[144,238,144],lightgrey:[211,211,211],lightpink:[255,182,193],lightyellow:[255,255,224],lime:[0,255,0],magenta:[255,0,255],maroon:[128,0,0],navy:[0,0,128],olive:[128,128,0],orange:[255,165,0],pink:[255,192,203],purple:[128,0,128],violet:[128,0,128],red:[255,0,0],silver:[192,192,192],white:[255,255,255],yellow:[255,255,0]}})(jQuery);(function(e){function n(t,n){var r=n.children("."+t)[0];if(r==null){r=document.createElement("canvas");r.className=t;e(r).css({direction:"ltr",position:"absolute",left:0,top:0}).appendTo(n);if(!r.getContext){if(window.G_vmlCanvasManager){r=window.G_vmlCanvasManager.initElement(r)}else{throw new Error("Canvas is not available. If you're using IE with a fall-back such as Excanvas, then there's either a mistake in your conditional include, or the page has no DOCTYPE and is rendering in Quirks Mode.")}}}this.element=r;var i=this.context=r.getContext("2d");var s=window.devicePixelRatio||1,o=i.webkitBackingStorePixelRatio||i.mozBackingStorePixelRatio||i.msBackingStorePixelRatio||i.oBackingStorePixelRatio||i.backingStorePixelRatio||1;this.pixelRatio=s/o;this.resize(n.width(),n.height());this.textContainer=null;this.text={};this._textCache={}}function r(t,r,s,o){function E(e,t){t=[w].concat(t);for(var n=0;n<e.length;++n)e[n].apply(this,t)}function S(){var t={Canvas:n};for(var r=0;r<o.length;++r){var i=o[r];i.init(w,t);if(i.options)e.extend(true,a,i.options)}}function x(n){e.extend(true,a,n);if(n&&n.colors){a.colors=n.colors}if(a.xaxis.color==null)a.xaxis.color=e.color.parse(a.grid.color).scale("a",.22).toString();if(a.yaxis.color==null)a.yaxis.color=e.color.parse(a.grid.color).scale("a",.22).toString();if(a.xaxis.tickColor==null)a.xaxis.tickColor=a.grid.tickColor||a.xaxis.color;if(a.yaxis.tickColor==null)a.yaxis.tickColor=a.grid.tickColor||a.yaxis.color;if(a.grid.borderColor==null)a.grid.borderColor=a.grid.color;if(a.grid.tickColor==null)a.grid.tickColor=e.color.parse(a.grid.color).scale("a",.22).toString();var r,i,s,o=t.css("font-size"),u=o?+o.replace("px",""):13,f={style:t.css("font-style"),size:Math.round(.8*u),variant:t.css("font-variant"),weight:t.css("font-weight"),family:t.css("font-family")};s=a.xaxes.length||1;for(r=0;r<s;++r){i=a.xaxes[r];if(i&&!i.tickColor){i.tickColor=i.color}i=e.extend(true,{},a.xaxis,i);a.xaxes[r]=i;if(i.font){i.font=e.extend({},f,i.font);if(!i.font.color){i.font.color=i.color}if(!i.font.lineHeight){i.font.lineHeight=Math.round(i.font.size*1.15)}}}s=a.yaxes.length||1;for(r=0;r<s;++r){i=a.yaxes[r];if(i&&!i.tickColor){i.tickColor=i.color}i=e.extend(true,{},a.yaxis,i);a.yaxes[r]=i;if(i.font){i.font=e.extend({},f,i.font);if(!i.font.color){i.font.color=i.color}if(!i.font.lineHeight){i.font.lineHeight=Math.round(i.font.size*1.15)}}}if(a.xaxis.noTicks&&a.xaxis.ticks==null)a.xaxis.ticks=a.xaxis.noTicks;if(a.yaxis.noTicks&&a.yaxis.ticks==null)a.yaxis.ticks=a.yaxis.noTicks;if(a.x2axis){a.xaxes[1]=e.extend(true,{},a.xaxis,a.x2axis);a.xaxes[1].position="top"}if(a.y2axis){a.yaxes[1]=e.extend(true,{},a.yaxis,a.y2axis);a.yaxes[1].position="right"}if(a.grid.coloredAreas)a.grid.markings=a.grid.coloredAreas;if(a.grid.coloredAreasColor)a.grid.markingsColor=a.grid.coloredAreasColor;if(a.lines)e.extend(true,a.series.lines,a.lines);if(a.points)e.extend(true,a.series.points,a.points);if(a.bars)e.extend(true,a.series.bars,a.bars);if(a.shadowSize!=null)a.series.shadowSize=a.shadowSize;if(a.highlightColor!=null)a.series.highlightColor=a.highlightColor;for(r=0;r<a.xaxes.length;++r)O(d,r+1).options=a.xaxes[r];for(r=0;r<a.yaxes.length;++r)O(v,r+1).options=a.yaxes[r];for(var l in b)if(a.hooks[l]&&a.hooks[l].length)b[l]=b[l].concat(a.hooks[l]);E(b.processOptions,[a])}function T(e){u=N(e);M();_()}function N(t){var n=[];for(var r=0;r<t.length;++r){var i=e.extend(true,{},a.series);if(t[r].data!=null){i.data=t[r].data;delete t[r].data;e.extend(true,i,t[r]);t[r].data=i.data}else i.data=t[r];n.push(i)}return n}function C(e,t){var n=e[t+"axis"];if(typeof n=="object")n=n.n;if(typeof n!="number")n=1;return n}function k(){return e.grep(d.concat(v),function(e){return e})}function L(e){var t={},n,r;for(n=0;n<d.length;++n){r=d[n];if(r&&r.used)t["x"+r.n]=r.c2p(e.left)}for(n=0;n<v.length;++n){r=v[n];if(r&&r.used)t["y"+r.n]=r.c2p(e.top)}if(t.x1!==undefined)t.x=t.x1;if(t.y1!==undefined)t.y=t.y1;return t}function A(e){var t={},n,r,i;for(n=0;n<d.length;++n){r=d[n];if(r&&r.used){i="x"+r.n;if(e[i]==null&&r.n==1)i="x";if(e[i]!=null){t.left=r.p2c(e[i]);break}}}for(n=0;n<v.length;++n){r=v[n];if(r&&r.used){i="y"+r.n;if(e[i]==null&&r.n==1)i="y";if(e[i]!=null){t.top=r.p2c(e[i]);break}}}return t}function O(t,n){if(!t[n-1])t[n-1]={n:n,direction:t==d?"x":"y",options:e.extend(true,{},t==d?a.xaxis:a.yaxis)};return t[n-1]}function M(){var t=u.length,n=-1,r;for(r=0;r<u.length;++r){var i=u[r].color;if(i!=null){t--;if(typeof i=="number"&&i>n){n=i}}}if(t<=n){t=n+1}var s,o=[],f=a.colors,l=f.length,c=0;for(r=0;r<t;r++){s=e.color.parse(f[r%l]||"#666");if(r%l==0&&r){if(c>=0){if(c<.5){c=-c-.2}else c=0}else c=-c}o[r]=s.scale("rgb",1+c)}var h=0,p;for(r=0;r<u.length;++r){p=u[r];if(p.color==null){p.color=o[h].toString();++h}else if(typeof p.color=="number")p.color=o[p.color].toString();if(p.lines.show==null){var m,g=true;for(m in p)if(p[m]&&p[m].show){g=false;break}if(g)p.lines.show=true}if(p.lines.zero==null){p.lines.zero=!!p.lines.fill}p.xaxis=O(d,C(p,"x"));p.yaxis=O(v,C(p,"y"))}}function _(){function x(e,t,n){if(t<e.datamin&&t!=-r)e.datamin=t;if(n>e.datamax&&n!=r)e.datamax=n}var t=Number.POSITIVE_INFINITY,n=Number.NEGATIVE_INFINITY,r=Number.MAX_VALUE,i,s,o,a,f,l,c,h,p,d,v,m,g,y,w,S;e.each(k(),function(e,r){r.datamin=t;r.datamax=n;r.used=false});for(i=0;i<u.length;++i){l=u[i];l.datapoints={points:[]};E(b.processRawData,[l,l.data,l.datapoints])}for(i=0;i<u.length;++i){l=u[i];w=l.data;S=l.datapoints.format;if(!S){S=[];S.push({x:true,number:true,required:true});S.push({y:true,number:true,required:true});if(l.bars.show||l.lines.show&&l.lines.fill){var T=!!(l.bars.show&&l.bars.zero||l.lines.show&&l.lines.zero);S.push({y:true,number:true,required:false,defaultValue:0,autoscale:T});if(l.bars.horizontal){delete S[S.length-1].y;S[S.length-1].x=true}}l.datapoints.format=S}if(l.datapoints.pointsize!=null)continue;l.datapoints.pointsize=S.length;h=l.datapoints.pointsize;c=l.datapoints.points;var N=l.lines.show&&l.lines.steps;l.xaxis.used=l.yaxis.used=true;for(s=o=0;s<w.length;++s,o+=h){y=w[s];var C=y==null;if(!C){for(a=0;a<h;++a){m=y[a];g=S[a];if(g){if(g.number&&m!=null){m=+m;if(isNaN(m))m=null;else if(m==Infinity)m=r;else if(m==-Infinity)m=-r}if(m==null){if(g.required)C=true;if(g.defaultValue!=null)m=g.defaultValue}}c[o+a]=m}}if(C){for(a=0;a<h;++a){m=c[o+a];if(m!=null){g=S[a];if(g.autoscale!==false){if(g.x){x(l.xaxis,m,m)}if(g.y){x(l.yaxis,m,m)}}}c[o+a]=null}}else{if(N&&o>0&&c[o-h]!=null&&c[o-h]!=c[o]&&c[o-h+1]!=c[o+1]){for(a=0;a<h;++a)c[o+h+a]=c[o+a];c[o+1]=c[o-h+1];o+=h}}}}for(i=0;i<u.length;++i){l=u[i];E(b.processDatapoints,[l,l.datapoints])}for(i=0;i<u.length;++i){l=u[i];c=l.datapoints.points;h=l.datapoints.pointsize;S=l.datapoints.format;var L=t,A=t,O=n,M=n;for(s=0;s<c.length;s+=h){if(c[s]==null)continue;for(a=0;a<h;++a){m=c[s+a];g=S[a];if(!g||g.autoscale===false||m==r||m==-r)continue;if(g.x){if(m<L)L=m;if(m>O)O=m}if(g.y){if(m<A)A=m;if(m>M)M=m}}}if(l.bars.show){var _;switch(l.bars.align){case"left":_=0;break;case"right":_=-l.bars.barWidth;break;default:_=-l.bars.barWidth/2}if(l.bars.horizontal){A+=_;M+=_+l.bars.barWidth}else{L+=_;O+=_+l.bars.barWidth}}x(l.xaxis,L,O);x(l.yaxis,A,M)}e.each(k(),function(e,r){if(r.datamin==t)r.datamin=null;if(r.datamax==n)r.datamax=null})}function D(){t.css("padding",0).children().filter(function(){return!e(this).hasClass("flot-overlay")&&!e(this).hasClass("flot-base")}).remove();if(t.css("position")=="static")t.css("position","relative");f=new n("flot-base",t);l=new n("flot-overlay",t);h=f.context;p=l.context;c=e(l.element).unbind();var r=t.data("plot");if(r){r.shutdown();l.clear()}t.data("plot",w)}function P(){if(a.grid.hoverable){c.mousemove(at);c.bind("mouseleave",ft)}if(a.grid.clickable)c.click(lt);E(b.bindEvents,[c])}function H(){if(ot)clearTimeout(ot);c.unbind("mousemove",at);c.unbind("mouseleave",ft);c.unbind("click",lt);E(b.shutdown,[c])}function B(e){function t(e){return e}var n,r,i=e.options.transform||t,s=e.options.inverseTransform;if(e.direction=="x"){n=e.scale=g/Math.abs(i(e.max)-i(e.min));r=Math.min(i(e.max),i(e.min))}else{n=e.scale=y/Math.abs(i(e.max)-i(e.min));n=-n;r=Math.max(i(e.max),i(e.min))}if(i==t)e.p2c=function(e){return(e-r)*n};else e.p2c=function(e){return(i(e)-r)*n};if(!s)e.c2p=function(e){return r+e/n};else e.c2p=function(e){return s(r+e/n)}}function j(e){var t=e.options,n=e.ticks||[],r=t.labelWidth||0,i=t.labelHeight||0,s=r||(e.direction=="x"?Math.floor(f.width/(n.length||1)):null),o=e.direction+"Axis "+e.direction+e.n+"Axis",u="flot-"+e.direction+"-axis flot-"+e.direction+e.n+"-axis "+o,a=t.font||"flot-tick-label tickLabel";for(var l=0;l<n.length;++l){var c=n[l];if(!c.label)continue;var h=f.getTextInfo(u,c.label,a,null,s);r=Math.max(r,h.width);i=Math.max(i,h.height)}e.labelWidth=t.labelWidth||r;e.labelHeight=t.labelHeight||i}function F(t){var n=t.labelWidth,r=t.labelHeight,i=t.options.position,s=t.direction==="x",o=t.options.tickLength,u=a.grid.axisMargin,l=a.grid.labelMargin,c=true,h=true,p=true,g=false;e.each(s?d:v,function(e,n){if(n&&n.reserveSpace){if(n===t){g=true}else if(n.options.position===i){if(g){h=false}else{c=false}}if(!g){p=false}}});if(h){u=0}if(o==null){o=p?"full":5}if(!isNaN(+o))l+=+o;if(s){r+=l;if(i=="bottom"){m.bottom+=r+u;t.box={top:f.height-m.bottom,height:r}}else{t.box={top:m.top+u,height:r};m.top+=r+u}}else{n+=l;if(i=="left"){t.box={left:m.left+u,width:n};m.left+=n+u}else{m.right+=n+u;t.box={left:f.width-m.right,width:n}}}t.position=i;t.tickLength=o;t.box.padding=l;t.innermost=c}function I(e){if(e.direction=="x"){e.box.left=m.left-e.labelWidth/2;e.box.width=f.width-m.left-m.right+e.labelWidth}else{e.box.top=m.top-e.labelHeight/2;e.box.height=f.height-m.bottom-m.top+e.labelHeight}}function q(){var t=a.grid.minBorderMargin,n,r;if(t==null){t=0;for(r=0;r<u.length;++r)t=Math.max(t,2*(u[r].points.radius+u[r].points.lineWidth/2))}var i={left:t,right:t,top:t,bottom:t};e.each(k(),function(e,t){if(t.reserveSpace&&t.ticks&&t.ticks.length){var n=t.ticks[t.ticks.length-1];if(t.direction==="x"){i.left=Math.max(i.left,t.labelWidth/2);if(n.v<=t.max){i.right=Math.max(i.right,t.labelWidth/2)}}else{i.bottom=Math.max(i.bottom,t.labelHeight/2);if(n.v<=t.max){i.top=Math.max(i.top,t.labelHeight/2)}}}});m.left=Math.ceil(Math.max(i.left,m.left));m.right=Math.ceil(Math.max(i.right,m.right));m.top=Math.ceil(Math.max(i.top,m.top));m.bottom=Math.ceil(Math.max(i.bottom,m.bottom))}function R(){var t,n=k(),r=a.grid.show;for(var i in m){var s=a.grid.margin||0;m[i]=typeof s=="number"?s:s[i]||0}E(b.processOffset,[m]);for(var i in m){if(typeof a.grid.borderWidth=="object"){m[i]+=r?a.grid.borderWidth[i]:0}else{m[i]+=r?a.grid.borderWidth:0}}e.each(n,function(e,t){t.show=t.options.show;if(t.show==null)t.show=t.used;t.reserveSpace=t.show||t.options.reserveSpace;U(t)});if(r){var o=e.grep(n,function(e){return e.reserveSpace});e.each(o,function(e,t){z(t);W(t);X(t,t.ticks);j(t)});for(t=o.length-1;t>=0;--t)F(o[t]);q();e.each(o,function(e,t){I(t)})}g=f.width-m.left-m.right;y=f.height-m.bottom-m.top;e.each(n,function(e,t){B(t)});if(r){G()}it()}function U(e){var t=e.options,n=+(t.min!=null?t.min:e.datamin),r=+(t.max!=null?t.max:e.datamax),i=r-n;if(i==0){var s=r==0?1:.01;if(t.min==null)n-=s;if(t.max==null||t.min!=null)r+=s}else{var o=t.autoscaleMargin;if(o!=null){if(t.min==null){n-=i*o;if(n<0&&e.datamin!=null&&e.datamin>=0)n=0}if(t.max==null){r+=i*o;if(r>0&&e.datamax!=null&&e.datamax<=0)r=0}}}e.min=n;e.max=r}function z(t){var n=t.options;var r;if(typeof n.ticks=="number"&&n.ticks>0)r=n.ticks;else r=.3*Math.sqrt(t.direction=="x"?f.width:f.height);var s=(t.max-t.min)/r,o=-Math.floor(Math.log(s)/Math.LN10),u=n.tickDecimals;if(u!=null&&o>u){o=u}var a=Math.pow(10,-o),l=s/a,c;if(l<1.5){c=1}else if(l<3){c=2;if(l>2.25&&(u==null||o+1<=u)){c=2.5;++o}}else if(l<7.5){c=5}else{c=10}c*=a;if(n.minTickSize!=null&&c<n.minTickSize){c=n.minTickSize}t.delta=s;t.tickDecimals=Math.max(0,u!=null?u:o);t.tickSize=n.tickSize||c;if(n.mode=="time"&&!t.tickGenerator){throw new Error("Time mode requires the flot.time plugin.")}if(!t.tickGenerator){t.tickGenerator=function(e){var t=[],n=i(e.min,e.tickSize),r=0,s=Number.NaN,o;do{o=s;s=n+r*e.tickSize;t.push(s);++r}while(s<e.max&&s!=o);return t};t.tickFormatter=function(e,t){var n=t.tickDecimals?Math.pow(10,t.tickDecimals):1;var r=""+Math.round(e*n)/n;if(t.tickDecimals!=null){var i=r.indexOf(".");var s=i==-1?0:r.length-i-1;if(s<t.tickDecimals){return(s?r:r+".")+(""+n).substr(1,t.tickDecimals-s)}}return r}}if(e.isFunction(n.tickFormatter))t.tickFormatter=function(e,t){return""+n.tickFormatter(e,t)};if(n.alignTicksWithAxis!=null){var h=(t.direction=="x"?d:v)[n.alignTicksWithAxis-1];if(h&&h.used&&h!=t){var p=t.tickGenerator(t);if(p.length>0){if(n.min==null)t.min=Math.min(t.min,p[0]);if(n.max==null&&p.length>1)t.max=Math.max(t.max,p[p.length-1])}t.tickGenerator=function(e){var t=[],n,r;for(r=0;r<h.ticks.length;++r){n=(h.ticks[r].v-h.min)/(h.max-h.min);n=e.min+n*(e.max-e.min);t.push(n)}return t};if(!t.mode&&n.tickDecimals==null){var m=Math.max(0,-Math.floor(Math.log(t.delta)/Math.LN10)+1),g=t.tickGenerator(t);if(!(g.length>1&&/\..*0$/.test((g[1]-g[0]).toFixed(m))))t.tickDecimals=m}}}}function W(t){var n=t.options.ticks,r=[];if(n==null||typeof n=="number"&&n>0)r=t.tickGenerator(t);else if(n){if(e.isFunction(n))r=n(t);else r=n}var i,s;t.ticks=[];for(i=0;i<r.length;++i){var o=null;var u=r[i];if(typeof u=="object"){s=+u[0];if(u.length>1)o=u[1]}else s=+u;if(o==null)o=t.tickFormatter(s,t);if(!isNaN(s))t.ticks.push({v:s,label:o})}}function X(e,t){if(e.options.autoscaleMargin&&t.length>0){if(e.options.min==null)e.min=Math.min(e.min,t[0].v);if(e.options.max==null&&t.length>1)e.max=Math.max(e.max,t[t.length-1].v)}}function V(){f.clear();E(b.drawBackground,[h]);var e=a.grid;if(e.show&&e.backgroundColor)K();if(e.show&&!e.aboveData){Q()}for(var t=0;t<u.length;++t){E(b.drawSeries,[h,u[t]]);Y(u[t])}E(b.draw,[h]);if(e.show&&e.aboveData){Q()}f.render();ht()}function J(e,t){var n,r,i,s,o=k();for(var u=0;u<o.length;++u){n=o[u];if(n.direction==t){s=t+n.n+"axis";if(!e[s]&&n.n==1)s=t+"axis";if(e[s]){r=e[s].from;i=e[s].to;break}}}if(!e[s]){n=t=="x"?d[0]:v[0];r=e[t+"1"];i=e[t+"2"]}if(r!=null&&i!=null&&r>i){var a=r;r=i;i=a}return{from:r,to:i,axis:n}}function K(){h.save();h.translate(m.left,m.top);h.fillStyle=bt(a.grid.backgroundColor,y,0,"rgba(255, 255, 255, 0)");h.fillRect(0,0,g,y);h.restore()}function Q(){var t,n,r,i;h.save();h.translate(m.left,m.top);var s=a.grid.markings;if(s){if(e.isFunction(s)){n=w.getAxes();n.xmin=n.xaxis.min;n.xmax=n.xaxis.max;n.ymin=n.yaxis.min;n.ymax=n.yaxis.max;s=s(n)}for(t=0;t<s.length;++t){var o=s[t],u=J(o,"x"),f=J(o,"y");if(u.from==null)u.from=u.axis.min;if(u.to==null)u.to=u.axis.max;if(f.from==null)f.from=f.axis.min;if(f.to==null)f.to=f.axis.max;if(u.to<u.axis.min||u.from>u.axis.max||f.to<f.axis.min||f.from>f.axis.max)continue;u.from=Math.max(u.from,u.axis.min);u.to=Math.min(u.to,u.axis.max);f.from=Math.max(f.from,f.axis.min);f.to=Math.min(f.to,f.axis.max);if(u.from==u.to&&f.from==f.to)continue;u.from=u.axis.p2c(u.from);u.to=u.axis.p2c(u.to);f.from=f.axis.p2c(f.from);f.to=f.axis.p2c(f.to);if(u.from==u.to||f.from==f.to){h.beginPath();h.strokeStyle=o.color||a.grid.markingsColor;h.lineWidth=o.lineWidth||a.grid.markingsLineWidth;h.moveTo(u.from,f.from);h.lineTo(u.to,f.to);h.stroke()}else{h.fillStyle=o.color||a.grid.markingsColor;h.fillRect(u.from,f.to,u.to-u.from,f.from-f.to)}}}n=k();r=a.grid.borderWidth;for(var l=0;l<n.length;++l){var c=n[l],p=c.box,d=c.tickLength,v,b,E,S;if(!c.show||c.ticks.length==0)continue;h.lineWidth=1;if(c.direction=="x"){v=0;if(d=="full")b=c.position=="top"?0:y;else b=p.top-m.top+(c.position=="top"?p.height:0)}else{b=0;if(d=="full")v=c.position=="left"?0:g;else v=p.left-m.left+(c.position=="left"?p.width:0)}if(!c.innermost){h.strokeStyle=c.options.color;h.beginPath();E=S=0;if(c.direction=="x")E=g+1;else S=y+1;if(h.lineWidth==1){if(c.direction=="x"){b=Math.floor(b)+.5}else{v=Math.floor(v)+.5}}h.moveTo(v,b);h.lineTo(v+E,b+S);h.stroke()}h.strokeStyle=c.options.tickColor;h.beginPath();for(t=0;t<c.ticks.length;++t){var x=c.ticks[t].v;E=S=0;if(isNaN(x)||x<c.min||x>c.max||d=="full"&&(typeof r=="object"&&r[c.position]>0||r>0)&&(x==c.min||x==c.max))continue;if(c.direction=="x"){v=c.p2c(x);S=d=="full"?-y:d;if(c.position=="top")S=-S}else{b=c.p2c(x);E=d=="full"?-g:d;if(c.position=="left")E=-E}if(h.lineWidth==1){if(c.direction=="x")v=Math.floor(v)+.5;else b=Math.floor(b)+.5}h.moveTo(v,b);h.lineTo(v+E,b+S)}h.stroke()}if(r){i=a.grid.borderColor;if(typeof r=="object"||typeof i=="object"){if(typeof r!=="object"){r={top:r,right:r,bottom:r,left:r}}if(typeof i!=="object"){i={top:i,right:i,bottom:i,left:i}}if(r.top>0){h.strokeStyle=i.top;h.lineWidth=r.top;h.beginPath();h.moveTo(0-r.left,0-r.top/2);h.lineTo(g,0-r.top/2);h.stroke()}if(r.right>0){h.strokeStyle=i.right;h.lineWidth=r.right;h.beginPath();h.moveTo(g+r.right/2,0-r.top);h.lineTo(g+r.right/2,y);h.stroke()}if(r.bottom>0){h.strokeStyle=i.bottom;h.lineWidth=r.bottom;h.beginPath();h.moveTo(g+r.right,y+r.bottom/2);h.lineTo(0,y+r.bottom/2);h.stroke()}if(r.left>0){h.strokeStyle=i.left;h.lineWidth=r.left;h.beginPath();h.moveTo(0-r.left/2,y+r.bottom);h.lineTo(0-r.left/2,0);h.stroke()}}else{h.lineWidth=r;h.strokeStyle=a.grid.borderColor;h.strokeRect(-r/2,-r/2,g+r,y+r)}}h.restore()}function G(){e.each(k(),function(e,t){var n=t.box,r=t.direction+"Axis "+t.direction+t.n+"Axis",i="flot-"+t.direction+"-axis flot-"+t.direction+t.n+"-axis "+r,s=t.options.font||"flot-tick-label tickLabel",o,u,a,l,c;f.removeText(i);if(!t.show||t.ticks.length==0)return;for(var h=0;h<t.ticks.length;++h){o=t.ticks[h];if(!o.label||o.v<t.min||o.v>t.max)continue;if(t.direction=="x"){l="center";u=m.left+t.p2c(o.v);if(t.position=="bottom"){a=n.top+n.padding}else{a=n.top+n.height-n.padding;c="bottom"}}else{c="middle";a=m.top+t.p2c(o.v);if(t.position=="left"){u=n.left+n.width-n.padding;l="right"}else{u=n.left+n.padding}}f.addText(i,u,a,o.label,s,null,null,l,c)}})}function Y(e){if(e.lines.show)Z(e);if(e.bars.show)nt(e);if(e.points.show)et(e)}function Z(e){function t(e,t,n,r,i){var s=e.points,o=e.pointsize,u=null,a=null;h.beginPath();for(var f=o;f<s.length;f+=o){var l=s[f-o],c=s[f-o+1],p=s[f],d=s[f+1];if(l==null||p==null)continue;if(c<=d&&c<i.min){if(d<i.min)continue;l=(i.min-c)/(d-c)*(p-l)+l;c=i.min}else if(d<=c&&d<i.min){if(c<i.min)continue;p=(i.min-c)/(d-c)*(p-l)+l;d=i.min}if(c>=d&&c>i.max){if(d>i.max)continue;l=(i.max-c)/(d-c)*(p-l)+l;c=i.max}else if(d>=c&&d>i.max){if(c>i.max)continue;p=(i.max-c)/(d-c)*(p-l)+l;d=i.max}if(l<=p&&l<r.min){if(p<r.min)continue;c=(r.min-l)/(p-l)*(d-c)+c;l=r.min}else if(p<=l&&p<r.min){if(l<r.min)continue;d=(r.min-l)/(p-l)*(d-c)+c;p=r.min}if(l>=p&&l>r.max){if(p>r.max)continue;c=(r.max-l)/(p-l)*(d-c)+c;l=r.max}else if(p>=l&&p>r.max){if(l>r.max)continue;d=(r.max-l)/(p-l)*(d-c)+c;p=r.max}if(l!=u||c!=a)h.moveTo(r.p2c(l)+t,i.p2c(c)+n);u=p;a=d;h.lineTo(r.p2c(p)+t,i.p2c(d)+n)}h.stroke()}function n(e,t,n){var r=e.points,i=e.pointsize,s=Math.min(Math.max(0,n.min),n.max),o=0,u,a=false,f=1,l=0,c=0;while(true){if(i>0&&o>r.length+i)break;o+=i;var p=r[o-i],d=r[o-i+f],v=r[o],m=r[o+f];if(a){if(i>0&&p!=null&&v==null){c=o;i=-i;f=2;continue}if(i<0&&o==l+i){h.fill();a=false;i=-i;f=1;o=l=c+i;continue}}if(p==null||v==null)continue;if(p<=v&&p<t.min){if(v<t.min)continue;d=(t.min-p)/(v-p)*(m-d)+d;p=t.min}else if(v<=p&&v<t.min){if(p<t.min)continue;m=(t.min-p)/(v-p)*(m-d)+d;v=t.min}if(p>=v&&p>t.max){if(v>t.max)continue;d=(t.max-p)/(v-p)*(m-d)+d;p=t.max}else if(v>=p&&v>t.max){if(p>t.max)continue;m=(t.max-p)/(v-p)*(m-d)+d;v=t.max}if(!a){h.beginPath();h.moveTo(t.p2c(p),n.p2c(s));a=true}if(d>=n.max&&m>=n.max){h.lineTo(t.p2c(p),n.p2c(n.max));h.lineTo(t.p2c(v),n.p2c(n.max));continue}else if(d<=n.min&&m<=n.min){h.lineTo(t.p2c(p),n.p2c(n.min));h.lineTo(t.p2c(v),n.p2c(n.min));continue}var g=p,y=v;if(d<=m&&d<n.min&&m>=n.min){p=(n.min-d)/(m-d)*(v-p)+p;d=n.min}else if(m<=d&&m<n.min&&d>=n.min){v=(n.min-d)/(m-d)*(v-p)+p;m=n.min}if(d>=m&&d>n.max&&m<=n.max){p=(n.max-d)/(m-d)*(v-p)+p;d=n.max}else if(m>=d&&m>n.max&&d<=n.max){v=(n.max-d)/(m-d)*(v-p)+p;m=n.max}if(p!=g){h.lineTo(t.p2c(g),n.p2c(d))}h.lineTo(t.p2c(p),n.p2c(d));h.lineTo(t.p2c(v),n.p2c(m));if(v!=y){h.lineTo(t.p2c(v),n.p2c(m));h.lineTo(t.p2c(y),n.p2c(m))}}}h.save();h.translate(m.left,m.top);h.lineJoin="round";var r=e.lines.lineWidth,i=e.shadowSize;if(r>0&&i>0){h.lineWidth=i;h.strokeStyle="rgba(0,0,0,0.1)";var s=Math.PI/18;t(e.datapoints,Math.sin(s)*(r/2+i/2),Math.cos(s)*(r/2+i/2),e.xaxis,e.yaxis);h.lineWidth=i/2;t(e.datapoints,Math.sin(s)*(r/2+i/4),Math.cos(s)*(r/2+i/4),e.xaxis,e.yaxis)}h.lineWidth=r;h.strokeStyle=e.color;var o=rt(e.lines,e.color,0,y);if(o){h.fillStyle=o;n(e.datapoints,e.xaxis,e.yaxis)}if(r>0)t(e.datapoints,0,0,e.xaxis,e.yaxis);h.restore()}function et(e){function t(e,t,n,r,i,s,o,u){var a=e.points,f=e.pointsize;for(var l=0;l<a.length;l+=f){var c=a[l],p=a[l+1];if(c==null||c<s.min||c>s.max||p<o.min||p>o.max)continue;h.beginPath();c=s.p2c(c);p=o.p2c(p)+r;if(u=="circle")h.arc(c,p,t,0,i?Math.PI:Math.PI*2,false);else u(h,c,p,t,i);h.closePath();if(n){h.fillStyle=n;h.fill()}h.stroke()}}h.save();h.translate(m.left,m.top);var n=e.points.lineWidth,r=e.shadowSize,i=e.points.radius,s=e.points.symbol;if(n==0)n=1e-4;if(n>0&&r>0){var o=r/2;h.lineWidth=o;h.strokeStyle="rgba(0,0,0,0.1)";t(e.datapoints,i,null,o+o/2,true,e.xaxis,e.yaxis,s);h.strokeStyle="rgba(0,0,0,0.2)";t(e.datapoints,i,null,o/2,true,e.xaxis,e.yaxis,s)}h.lineWidth=n;h.strokeStyle=e.color;t(e.datapoints,i,rt(e.points,e.color),0,false,e.xaxis,e.yaxis,s);h.restore()}function tt(e,t,n,r,i,s,o,u,a,f,l){var c,h,p,d,v,m,g,y,b;if(f){y=m=g=true;v=false;c=n;h=e;d=t+r;p=t+i;if(h<c){b=h;h=c;c=b;v=true;m=false}}else{v=m=g=true;y=false;c=e+r;h=e+i;p=n;d=t;if(d<p){b=d;d=p;p=b;y=true;g=false}}if(h<o.min||c>o.max||d<u.min||p>u.max)return;if(c<o.min){c=o.min;v=false}if(h>o.max){h=o.max;m=false}if(p<u.min){p=u.min;y=false}if(d>u.max){d=u.max;g=false}c=o.p2c(c);p=u.p2c(p);h=o.p2c(h);d=u.p2c(d);if(s){a.fillStyle=s(p,d);a.fillRect(c,d,h-c,p-d)}if(l>0&&(v||m||g||y)){a.beginPath();a.moveTo(c,p);if(v)a.lineTo(c,d);else a.moveTo(c,d);if(g)a.lineTo(h,d);else a.moveTo(h,d);if(m)a.lineTo(h,p);else a.moveTo(h,p);if(y)a.lineTo(c,p);else a.moveTo(c,p);a.stroke()}}function nt(e){function t(t,n,r,i,s,o){var u=t.points,a=t.pointsize;for(var f=0;f<u.length;f+=a){if(u[f]==null)continue;tt(u[f],u[f+1],u[f+2],n,r,i,s,o,h,e.bars.horizontal,e.bars.lineWidth)}}h.save();h.translate(m.left,m.top);h.lineWidth=e.bars.lineWidth;h.strokeStyle=e.color;var n;switch(e.bars.align){case"left":n=0;break;case"right":n=-e.bars.barWidth;break;default:n=-e.bars.barWidth/2}var r=e.bars.fill?function(t,n){return rt(e.bars,e.color,t,n)}:null;t(e.datapoints,n,n+e.bars.barWidth,r,e.xaxis,e.yaxis);h.restore()}function rt(t,n,r,i){var s=t.fill;if(!s)return null;if(t.fillColor)return bt(t.fillColor,r,i,n);var o=e.color.parse(n);o.a=typeof s=="number"?s:.4;o.normalize();return o.toString()}function it(){if(a.legend.container!=null){e(a.legend.container).html("")}else{t.find(".legend").remove()}if(!a.legend.show){return}var n=[],r=[],i=false,s=a.legend.labelFormatter,o,f;for(var l=0;l<u.length;++l){o=u[l];if(o.label){f=s?s(o.label,o):o.label;if(f){r.push({label:f,color:o.color})}}}if(a.legend.sorted){if(e.isFunction(a.legend.sorted)){r.sort(a.legend.sorted)}else if(a.legend.sorted=="reverse"){r.reverse()}else{var c=a.legend.sorted!="descending";r.sort(function(e,t){return e.label==t.label?0:e.label<t.label!=c?1:-1})}}for(var l=0;l<r.length;++l){var h=r[l];if(l%a.legend.noColumns==0){if(i)n.push("</tr>");n.push("<tr>");i=true}n.push('<td class="legendColorBox"><div style="border:1px solid '+a.legend.labelBoxBorderColor+';padding:1px"><div style="width:4px;height:0;border:5px solid '+h.color+';overflow:hidden"></div></div></td>'+'<td class="legendLabel">'+h.label+"</td>")}if(i)n.push("</tr>");if(n.length==0)return;var p='<table style="font-size:smaller;color:'+a.grid.color+'">'+n.join("")+"</table>";if(a.legend.container!=null)e(a.legend.container).html(p);else{var d="",v=a.legend.position,g=a.legend.margin;if(g[0]==null)g=[g,g];if(v.charAt(0)=="n")d+="top:"+(g[1]+m.top)+"px;";else if(v.charAt(0)=="s")d+="bottom:"+(g[1]+m.bottom)+"px;";if(v.charAt(1)=="e")d+="right:"+(g[0]+m.right)+"px;";else if(v.charAt(1)=="w")d+="left:"+(g[0]+m.left)+"px;";var y=e('<div class="legend">'+p.replace('style="','style="position:absolute;'+d+";")+"</div>").appendTo(t);if(a.legend.backgroundOpacity!=0){var b=a.legend.backgroundColor;if(b==null){b=a.grid.backgroundColor;if(b&&typeof b=="string")b=e.color.parse(b);else b=e.color.extract(y,"background-color");b.a=1;b=b.toString()}var w=y.children();e('<div style="position:absolute;width:'+w.width()+"px;height:"+w.height()+"px;"+d+"background-color:"+b+';"> </div>').prependTo(y).css("opacity",a.legend.backgroundOpacity)}}}function ut(e,t,n){var r=a.grid.mouseActiveRadius,i=r*r+1,s=null,o=false,f,l,c;for(f=u.length-1;f>=0;--f){if(!n(u[f]))continue;var h=u[f],p=h.xaxis,d=h.yaxis,v=h.datapoints.points,m=p.c2p(e),g=d.c2p(t),y=r/p.scale,b=r/d.scale;c=h.datapoints.pointsize;if(p.options.inverseTransform)y=Number.MAX_VALUE;if(d.options.inverseTransform)b=Number.MAX_VALUE;if(h.lines.show||h.points.show){for(l=0;l<v.length;l+=c){var w=v[l],E=v[l+1];if(w==null)continue;if(w-m>y||w-m<-y||E-g>b||E-g<-b)continue;var S=Math.abs(p.p2c(w)-e),x=Math.abs(d.p2c(E)-t),T=S*S+x*x;if(T<i){i=T;s=[f,l/c]}}}if(h.bars.show&&!s){var N,C;switch(h.bars.align){case"left":N=0;break;case"right":N=-h.bars.barWidth;break;default:N=-h.bars.barWidth/2}C=N+h.bars.barWidth;for(l=0;l<v.length;l+=c){var w=v[l],E=v[l+1],k=v[l+2];if(w==null)continue;if(u[f].bars.horizontal?m<=Math.max(k,w)&&m>=Math.min(k,w)&&g>=E+N&&g<=E+C:m>=w+N&&m<=w+C&&g>=Math.min(k,E)&&g<=Math.max(k,E))s=[f,l/c]}}}if(s){f=s[0];l=s[1];c=u[f].datapoints.pointsize;return{datapoint:u[f].datapoints.points.slice(l*c,(l+1)*c),dataIndex:l,series:u[f],seriesIndex:f}}return null}function at(e){if(a.grid.hoverable)ct("plothover",e,function(e){return e["hoverable"]!=false})}function ft(e){if(a.grid.hoverable)ct("plothover",e,function(e){return false})}function lt(e){ct("plotclick",e,function(e){return e["clickable"]!=false})}function ct(e,n,r){var i=c.offset(),s=n.pageX-i.left-m.left,o=n.pageY-i.top-m.top,u=L({left:s,top:o});u.pageX=n.pageX;u.pageY=n.pageY;var f=ut(s,o,r);if(f){f.pageX=parseInt(f.series.xaxis.p2c(f.datapoint[0])+i.left+m.left,10);f.pageY=parseInt(f.series.yaxis.p2c(f.datapoint[1])+i.top+m.top,10)}if(a.grid.autoHighlight){for(var l=0;l<st.length;++l){var h=st[l];if(h.auto==e&&!(f&&h.series==f.series&&h.point[0]==f.datapoint[0]&&h.point[1]==f.datapoint[1]))vt(h.series,h.point)}if(f)dt(f.series,f.datapoint,e)}t.trigger(e,[u,f])}function ht(){var e=a.interaction.redrawOverlayInterval;if(e==-1){pt();return}if(!ot)ot=setTimeout(pt,e)}function pt(){ot=null;p.save();l.clear();p.translate(m.left,m.top);var e,t;for(e=0;e<st.length;++e){t=st[e];if(t.series.bars.show)yt(t.series,t.point);else gt(t.series,t.point)}p.restore();E(b.drawOverlay,[p])}function dt(e,t,n){if(typeof e=="number")e=u[e];if(typeof t=="number"){var r=e.datapoints.pointsize;t=e.datapoints.points.slice(r*t,r*(t+1))}var i=mt(e,t);if(i==-1){st.push({series:e,point:t,auto:n});ht()}else if(!n)st[i].auto=false}function vt(e,t){if(e==null&&t==null){st=[];ht();return}if(typeof e=="number")e=u[e];if(typeof t=="number"){var n=e.datapoints.pointsize;t=e.datapoints.points.slice(n*t,n*(t+1))}var r=mt(e,t);if(r!=-1){st.splice(r,1);ht()}}function mt(e,t){for(var n=0;n<st.length;++n){var r=st[n];if(r.series==e&&r.point[0]==t[0]&&r.point[1]==t[1])return n}return-1}function gt(t,n){var r=n[0],i=n[1],s=t.xaxis,o=t.yaxis,u=typeof t.highlightColor==="string"?t.highlightColor:e.color.parse(t.color).scale("a",.5).toString();if(r<s.min||r>s.max||i<o.min||i>o.max)return;var a=t.points.radius+t.points.lineWidth/2;p.lineWidth=a;p.strokeStyle=u;var f=1.5*a;r=s.p2c(r);i=o.p2c(i);p.beginPath();if(t.points.symbol=="circle")p.arc(r,i,f,0,2*Math.PI,false);else t.points.symbol(p,r,i,f,false);p.closePath();p.stroke()}function yt(t,n){var r=typeof t.highlightColor==="string"?t.highlightColor:e.color.parse(t.color).scale("a",.5).toString(),i=r,s;switch(t.bars.align){case"left":s=0;break;case"right":s=-t.bars.barWidth;break;default:s=-t.bars.barWidth/2}p.lineWidth=t.bars.lineWidth;p.strokeStyle=r;tt(n[0],n[1],n[2]||0,s,s+t.bars.barWidth,function(){return i},t.xaxis,t.yaxis,p,t.bars.horizontal,t.bars.lineWidth)}function bt(t,n,r,i){if(typeof t=="string")return t;else{var s=h.createLinearGradient(0,r,0,n);for(var o=0,u=t.colors.length;o<u;++o){var a=t.colors[o];if(typeof a!="string"){var f=e.color.parse(i);if(a.brightness!=null)f=f.scale("rgb",a.brightness);if(a.opacity!=null)f.a*=a.opacity;a=f.toString()}s.addColorStop(o/(u-1),a)}return s}}var u=[],a={colors:["#edc240","#afd8f8","#cb4b4b","#4da74d","#9440ed"],legend:{show:true,noColumns:1,labelFormatter:null,labelBoxBorderColor:"#ccc",container:null,position:"ne",margin:5,backgroundColor:null,backgroundOpacity:.85,sorted:null},xaxis:{show:null,position:"bottom",mode:null,font:null,color:null,tickColor:null,transform:null,inverseTransform:null,min:null,max:null,autoscaleMargin:null,ticks:null,tickFormatter:null,labelWidth:null,labelHeight:null,reserveSpace:null,tickLength:null,alignTicksWithAxis:null,tickDecimals:null,tickSize:null,minTickSize:null},yaxis:{autoscaleMargin:.02,position:"left"},xaxes:[],yaxes:[],series:{points:{show:false,radius:3,lineWidth:2,fill:true,fillColor:"#ffffff",symbol:"circle"},lines:{lineWidth:2,fill:false,fillColor:null,steps:false},bars:{show:false,lineWidth:2,barWidth:1,fill:true,fillColor:null,align:"left",horizontal:false,zero:true},shadowSize:3,highlightColor:null},grid:{show:true,aboveData:false,color:"#545454",backgroundColor:null,borderColor:null,tickColor:null,margin:0,labelMargin:5,axisMargin:8,borderWidth:2,minBorderMargin:null,markings:null,markingsColor:"#f4f4f4",markingsLineWidth:2,clickable:false,hoverable:false,autoHighlight:true,mouseActiveRadius:10},interaction:{redrawOverlayInterval:1e3/60},hooks:{}},f=null,l=null,c=null,h=null,p=null,d=[],v=[],m={left:0,right:0,top:0,bottom:0},g=0,y=0,b={processOptions:[],processRawData:[],processDatapoints:[],processOffset:[],drawBackground:[],drawSeries:[],draw:[],bindEvents:[],drawOverlay:[],shutdown:[]},w=this;w.setData=T;w.setupGrid=R;w.draw=V;w.getPlaceholder=function(){return t};w.getCanvas=function(){return f.element};w.getPlotOffset=function(){return m};w.width=function(){return g};w.height=function(){return y};w.offset=function(){var e=c.offset();e.left+=m.left;e.top+=m.top;return e};w.getData=function(){return u};w.getAxes=function(){var t={},n;e.each(d.concat(v),function(e,n){if(n)t[n.direction+(n.n!=1?n.n:"")+"axis"]=n});return t};w.getXAxes=function(){return d};w.getYAxes=function(){return v};w.c2p=L;w.p2c=A;w.getOptions=function(){return a};w.highlight=dt;w.unhighlight=vt;w.triggerRedrawOverlay=ht;w.pointOffset=function(e){return{left:parseInt(d[C(e,"x")-1].p2c(+e.x)+m.left,10),top:parseInt(v[C(e,"y")-1].p2c(+e.y)+m.top,10)}};w.shutdown=H;w.destroy=function(){H();t.removeData("plot").empty();u=[];a=null;f=null;l=null;c=null;h=null;p=null;d=[];v=[];b=null;st=[];w=null};w.resize=function(){var e=t.width(),n=t.height();f.resize(e,n);l.resize(e,n)};w.hooks=b;S(w);x(s);D();T(r);R();V();P();var st=[],ot=null}function i(e,t){return t*Math.floor(e/t)}var t=Object.prototype.hasOwnProperty;n.prototype.resize=function(e,t){if(e<=0||t<=0){throw new Error("Invalid dimensions for plot, width = "+e+", height = "+t)}var n=this.element,r=this.context,i=this.pixelRatio;if(this.width!=e){n.width=e*i;n.style.width=e+"px";this.width=e}if(this.height!=t){n.height=t*i;n.style.height=t+"px";this.height=t}r.restore();r.save();r.scale(i,i)};n.prototype.clear=function(){this.context.clearRect(0,0,this.width,this.height)};n.prototype.render=function(){var e=this._textCache;for(var n in e){if(t.call(e,n)){var r=this.getTextLayer(n),i=e[n];r.hide();for(var s in i){if(t.call(i,s)){var o=i[s];for(var u in o){if(t.call(o,u)){var a=o[u].positions;for(var f=0,l;l=a[f];f++){if(l.active){if(!l.rendered){r.append(l.element);l.rendered=true}}else{a.splice(f--,1);if(l.rendered){l.element.detach()}}}if(a.length==0){delete o[u]}}}}}r.show()}}};n.prototype.getTextLayer=function(t){var n=this.text[t];if(n==null){if(this.textContainer==null){this.textContainer=e("<div class='flot-text'></div>").css({position:"absolute",top:0,left:0,bottom:0,right:0,"font-size":"smaller",color:"#545454"}).insertAfter(this.element)}n=this.text[t]=e("<div></div>").addClass(t).css({position:"absolute",top:0,left:0,bottom:0,right:0}).appendTo(this.textContainer)}return n};n.prototype.getTextInfo=function(t,n,r,i,s){var o,u,a,f;n=""+n;if(typeof r==="object"){o=r.style+" "+r.variant+" "+r.weight+" "+r.size+"px/"+r.lineHeight+"px "+r.family}else{o=r}u=this._textCache[t];if(u==null){u=this._textCache[t]={}}a=u[o];if(a==null){a=u[o]={}}f=a[n];if(f==null){var l=e("<div></div>").html(n).css({position:"absolute","max-width":s,top:-9999}).appendTo(this.getTextLayer(t));if(typeof r==="object"){l.css({font:o,color:r.color})}else if(typeof r==="string"){l.addClass(r)}f=a[n]={width:l.outerWidth(true),height:l.outerHeight(true),element:l,positions:[]};l.detach()}return f};n.prototype.addText=function(e,t,n,r,i,s,o,u,a){var f=this.getTextInfo(e,r,i,s,o),l=f.positions;if(u=="center"){t-=f.width/2}else if(u=="right"){t-=f.width}if(a=="middle"){n-=f.height/2}else if(a=="bottom"){n-=f.height}for(var c=0,h;h=l[c];c++){if(h.x==t&&h.y==n){h.active=true;return}}h={active:true,rendered:false,element:l.length?f.element.clone():f.element,x:t,y:n};l.push(h);h.element.css({top:Math.round(n),left:Math.round(t),"text-align":u})};n.prototype.removeText=function(e,n,r,i,s,o){if(i==null){var u=this._textCache[e];if(u!=null){for(var a in u){if(t.call(u,a)){var f=u[a];for(var l in f){if(t.call(f,l)){var c=f[l].positions;for(var h=0,p;p=c[h];h++){p.active=false}}}}}}}else{var c=this.getTextInfo(e,i,s,o).positions;for(var h=0,p;p=c[h];h++){if(p.x==n&&p.y==r){p.active=false}}}};e.plot=function(t,n,i){var s=new r(e(t),n,i,e.plot.plugins);return s};e.plot.version="0.8.2";e.plot.plugins=[];e.fn.plot=function(t,n){return this.each(function(){e.plot(this,t,n)})}})(jQuery);

/* flot navigate v0.8.2 |  https://github.com/flot/flot | Copyright (c) 2007-2013 IOLA and Ole Laursen. Licensed under the MIT license. */
(function(e){function t(i){var l,h=this,p=i.data||{};if(p.elem)h=i.dragTarget=p.elem,i.dragProxy=a.proxy||h,i.cursorOffsetX=p.pageX-p.left,i.cursorOffsetY=p.pageY-p.top,i.offsetX=i.pageX-i.cursorOffsetX,i.offsetY=i.pageY-i.cursorOffsetY;else if(a.dragging||p.which>0&&i.which!=p.which||e(i.target).is(p.not))return;switch(i.type){case"mousedown":return e.extend(p,e(h).offset(),{elem:h,target:i.target,pageX:i.pageX,pageY:i.pageY}),o.add(document,"mousemove mouseup",t,p),s(h,!1),a.dragging=null,!1;case!a.dragging&&"mousemove":if(r(i.pageX-p.pageX)+r(i.pageY-p.pageY)<p.distance)break;i.target=p.target,l=n(i,"dragstart",h),l!==!1&&(a.dragging=h,a.proxy=i.dragProxy=e(l||h)[0]);case"mousemove":if(a.dragging){if(l=n(i,"drag",h),u.drop&&(u.drop.allowed=l!==!1,u.drop.handler(i)),l!==!1)break;i.type="mouseup"};case"mouseup":o.remove(document,"mousemove mouseup",t),a.dragging&&(u.drop&&u.drop.handler(i),n(i,"dragend",h)),s(h,!0),a.dragging=a.proxy=p.elem=!1}return!0}function n(t,n,r){t.type=n;var i=e.event.dispatch.call(r,t);return i===!1?!1:i||t.result}function r(e){return Math.pow(e,2)}function i(){return a.dragging===!1}function s(e,t){e&&(e.unselectable=t?"off":"on",e.onselectstart=function(){return t},e.style&&(e.style.MozUserSelect=t?"":"none"))}e.fn.drag=function(e,t,n){return t&&this.bind("dragstart",e),n&&this.bind("dragend",n),e?this.bind("drag",t?t:e):this.trigger("drag")};var o=e.event,u=o.special,a=u.drag={not:":input",distance:0,which:1,dragging:!1,setup:function(n){n=e.extend({distance:a.distance,which:a.which,not:a.not},n||{}),n.distance=r(n.distance),o.add(this,"mousedown",t,n),this.attachEvent&&this.attachEvent("ondragstart",i)},teardown:function(){o.remove(this,"mousedown",t),this===a.dragging&&(a.dragging=a.proxy=!1),s(this,!0),this.detachEvent&&this.detachEvent("ondragstart",i)}};u.dragstart=u.dragend={setup:function(){},teardown:function(){}}})(jQuery);(function(e){function t(t){var n=t||window.event,r=[].slice.call(arguments,1),i=0,s=0,o=0,t=e.event.fix(n);t.type="mousewheel";n.wheelDelta&&(i=n.wheelDelta/120);n.detail&&(i=-n.detail/3);o=i;void 0!==n.axis&&n.axis===n.HORIZONTAL_AXIS&&(o=0,s=-1*i);void 0!==n.wheelDeltaY&&(o=n.wheelDeltaY/120);void 0!==n.wheelDeltaX&&(s=-1*n.wheelDeltaX/120);r.unshift(t,i,s,o);return(e.event.dispatch||e.event.handle).apply(this,r)}var n=["DOMMouseScroll","mousewheel"];if(e.event.fixHooks)for(var r=n.length;r;)e.event.fixHooks[n[--r]]=e.event.mouseHooks;e.event.special.mousewheel={setup:function(){if(this.addEventListener)for(var e=n.length;e;)this.addEventListener(n[--e],t,!1);else this.onmousewheel=t},teardown:function(){if(this.removeEventListener)for(var e=n.length;e;)this.removeEventListener(n[--e],t,!1);else this.onmousewheel=null}};e.fn.extend({mousewheel:function(e){return e?this.bind("mousewheel",e):this.trigger("mousewheel")},unmousewheel:function(e){return this.unbind("mousewheel",e)}})})(jQuery);(function(e){function n(t){function n(e,n){var r=t.offset();r.left=e.pageX-r.left;r.top=e.pageY-r.top;if(n)t.zoomOut({center:r});else t.zoom({center:r})}function r(e,t){e.preventDefault();n(e,t<0);return false}function a(e){if(e.which!=1)return false;var n=t.getPlaceholder().css("cursor");if(n)i=n;t.getPlaceholder().css("cursor",t.getOptions().pan.cursor);s=e.pageX;o=e.pageY}function f(e){var n=t.getOptions().pan.frameRate;if(u||!n)return;u=setTimeout(function(){t.pan({left:s-e.pageX,top:o-e.pageY});s=e.pageX;o=e.pageY;u=null},1/n*1e3)}function l(e){if(u){clearTimeout(u);u=null}t.getPlaceholder().css("cursor",i);t.pan({left:s-e.pageX,top:o-e.pageY})}function c(e,t){var i=e.getOptions();if(i.zoom.interactive){t[i.zoom.trigger](n);t.mousewheel(r)}if(i.pan.interactive){t.bind("dragstart",{distance:10},a);t.bind("drag",f);t.bind("dragend",l)}}function h(e,t){t.unbind(e.getOptions().zoom.trigger,n);t.unbind("mousewheel",r);t.unbind("dragstart",a);t.unbind("drag",f);t.unbind("dragend",l);if(u)clearTimeout(u)}var i="default",s=0,o=0,u=null;t.zoomOut=function(e){if(!e)e={};if(!e.amount)e.amount=t.getOptions().zoom.amount;e.amount=1/e.amount;t.zoom(e)};t.zoom=function(n){if(!n)n={};var r=n.center,i=n.amount||t.getOptions().zoom.amount,s=t.width(),o=t.height();if(!r)r={left:s/2,top:o/2};var u=r.left/s,a=r.top/o,f={x:{min:r.left-u*s/i,max:r.left+(1-u)*s/i},y:{min:r.top-a*o/i,max:r.top+(1-a)*o/i}};e.each(t.getAxes(),function(e,t){var n=t.options,r=f[t.direction].min,i=f[t.direction].max,s=n.zoomRange,o=n.panRange;if(s===false)return;r=t.c2p(r);i=t.c2p(i);if(r>i){var u=r;r=i;i=u}if(o){if(o[0]!=null&&r<o[0]){r=o[0]}if(o[1]!=null&&i>o[1]){i=o[1]}}var a=i-r;if(s&&(s[0]!=null&&a<s[0]||s[1]!=null&&a>s[1]))return;n.min=r;n.max=i});t.setupGrid();t.draw();if(!n.preventEvent)t.getPlaceholder().trigger("plotzoom",[t,n])};t.pan=function(n){var r={x:+n.left,y:+n.top};if(isNaN(r.x))r.x=0;if(isNaN(r.y))r.y=0;e.each(t.getAxes(),function(e,t){var n=t.options,i,s,o=r[t.direction];i=t.c2p(t.p2c(t.min)+o),s=t.c2p(t.p2c(t.max)+o);var u=n.panRange;if(u===false)return;if(u){if(u[0]!=null&&u[0]>i){o=u[0]-i;i+=o;s+=o}if(u[1]!=null&&u[1]<s){o=u[1]-s;i+=o;s+=o}}n.min=i;n.max=s});t.setupGrid();t.draw();if(!n.preventEvent)t.getPlaceholder().trigger("plotpan",[t,n])};t.hooks.bindEvents.push(c);t.hooks.shutdown.push(h)}var t={xaxis:{zoomRange:null,panRange:null},zoom:{interactive:false,trigger:"dblclick",amount:1.5},pan:{interactive:false,cursor:"move",frameRate:20}};e.plot.plugins.push({init:n,options:t,name:"navigate",version:"1.3"})})(jQuery);