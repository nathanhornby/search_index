Symphony.Language.add({
	'Indexing page {$page} of {$total}': false,
	'{$total} entries': false,
	'{$total} entry': false
});

var SearchIndex_Indexes = {

	sections: [],
	progress: 0,
	refresh_rate: 0,

	init: function() {

		var self = this;
		
		// new index section selection
		jQuery('select[name="fields[section_id]"]').bind('change', function() {
			var id = jQuery(this).val();
			window.location.href = Symphony.Context.get('root') + '/symphony/extension/search_index/indexes/new/' + id + '/';
		});

		// cache IDs of sections to re-index
		jQuery('span.to-re-index').each(function() {
			var span = jQuery(this);
			self.sections.push(span.attr('id').replace(/section\-/,''));
			span.removeClass('to-re-index');
		});

		this.refresh_rate = Symphony.Context.get('search_index')['re-index-refresh-rate'] * 1000;

		// go, go, go
		this.indexNextSection();

		this.bindUseAsSuggestion();

	},

	indexNextSection: function() {
		if (this.sections.length == this.progress) return;
		this.indexSectionByPage(this.sections[this.progress], 1);
	},

	indexSectionByPage: function(section_id, page) {
		var self = this;
		var span = jQuery('#section-' + section_id);
		span.parent().prev().addClass('spinner');

		jQuery.ajax({
			url: Symphony.Context.get('root') + '/symphony/extension/search_index/reindex/?section=' + section_id + '&page=' + page,
			success: function(xml) {
				var total_pages = parseInt(jQuery('pagination', xml).attr('total-pages'));
				var total_entries = jQuery('pagination', xml).attr('total-entries');

				span.show().text(
					Symphony.Language.get('Indexing page {$page} of {$total}', { page: page, total: total_pages})
				);

				// there are more pages left
				if (total_pages > 0 && total_pages != page++) {
					setTimeout(function() {
						self.indexSectionByPage(section_id, page);
					}, self.refresh_rate);
				}
				// proceed to next section
				else {					
					setTimeout(function() {
						if(total_entries == 1) {
							span.text(
								Symphony.Language.get('{$total} entry', { total: total_entries})
							);
						} else {
							span.text(
								Symphony.Language.get('{$total} entries', { total: total_entries})
							);
						}
						span.parent().prev().removeClass('spinner');
						self.progress++;
						self.indexNextSection();
					}, self.refresh_rate);
				}
			}
		});
	},

	bindUseAsSuggestion: function() {
		jQuery('table span.suggestion').bind('click', function() {
			var span = jQuery(this);
			var query = span.parent().find('.query').text();
			var use = span.hasClass('yes');
			var use_as_suggestion = (use) ? 'no' : 'yes';
			jQuery.get(Symphony.Context.get('root') + '/symphony/extension/search_index/mark_use_as_suggestion/?query='+query+'&use_as_suggestion='+use_as_suggestion, function() {
				if(use) {
					span.removeClass('yes');
				} else {
					span.addClass('yes');
				}
			})
		});
	},
};

jQuery(document).ready(function() {
	SearchIndex_Indexes.init();
});