/****************************************************************************************************** 
 * A jquery plugin implementing a styleable dropdown list
 * 
 * This plugin is developed with ddslick as example (See http://designwithpc.com/Plugins/ddslick), but
 * improved in some areas; particularly where ddslick lacks support for posting the "selected" option
 * to the server when the <select> is part of a form.
 * The idea to also support images (and description) using HTML5 data-imagesrc (and data-description)
 * is however completely based on ddslick.
 * This plugin is also a bit simpler with respect to the classes that it injects in the DOM. Styling
 * is also assumed to be handled by a very limited set of classes in CSS.
 * 
 * Usage:
 *  - Instantiation:
 *      $('#dd').ddlist({ onSelect: function (index, text, value) { ... }
 *      });
 *  - External methods:
 *      $('#dd').ddlist('select', { index: index [, text: string] [, value: string] });
 *
 * version 1.0.0
 *
 * @requires jQuery 1.8.0 or later
 *
 * Copyright (c) Jos Huybrighs
 * code.cwwonline.be
 *
 * Licensed under the MIT license.
 * http://en.wikipedia.org/wiki/MIT_License
 *
 ******************************************************************************************************/

; (function ($, win, document, undefined) {

    var pluginName = 'ddlist';

    function Plugin(element, options) {
        // Get the main element
        this.element = element;
        this.selObj = $(element);
        this.settings = {
            width: 260,
            selectionIndex: 0,
            showSelectionTextOnly: false,
            onSelectedOnInit: false,
            onSelected: function (index, value, text) { }
        };
        this._init(options);
    };

    Plugin.prototype = {

        // Select index
        _selectIndex: function(index) {
            // Remove current 'ddListOptionIsSelected' class
            var ddOptions = this.ddListObj.find('> ul');
            ddOptions.find('a').removeClass('ddListOptionIsSelected');

            // Set 'ddListOptionIsSelected' class to element that corresponds with index
            var selectedOption = ddOptions.find('a').eq(index);
            selectedOption.addClass('ddListOptionIsSelected');

            // Update selected index/value/text 
            var optionData = this.options[index];
            this.selectedIndex = index;
            this.selectedValue = optionData.value;
            this.selectedText = optionData.text;

            // Update <select> element
            // Clear current 'selected'
            this.selObj.find('option').attr('selected', false);
            // Set new 'selected'
            var selOption = this.selObj.find('option').eq(index);
            selOption.attr('selected', true);

            var ddSelection = this.ddListObj.find('> a');
            // Update ddListSelection element
            if (this.settings.showSelectionTextOnly) {
                ddSelection.html(optionData.text);
            }
            else {
                ddSelection.html((optionData.imageSrc ? '<img src="' + optionData.imageSrc + '" />' : '') +
                                 (optionData.text ? '<label>' + optionData.text + '</label>' : '') +
                                 (optionData.description ? '<small>' + optionData.description + '</small>' : '')
                );
            }
        },

        _open: function() {
            // Close possible other open dropdown lists
            var otherOpenListObjs = $('.ddListIsOpen').not(this.ddListObj);
            if (otherOpenListObjs.length != 0) {
                otherOpenListObjs.removeClass('ddListIsOpen');
                otherOpenListObjs.find('> ul').slideUp(50);
            }
            this.ddListObj.find('> ul').slideDown('fast');
            this.ddListObj.addClass('ddListIsOpen');
        },

        _close: function() {
            // Close drop down
            this.ddListObj.removeClass('ddListIsOpen');
            this.ddListObj.find('> ul').slideUp(50);
        },

        // Initialize 
        _init: function (options) {
            this.settings = $.extend({}, this.settings, options);
            var self = this;
 
            // Load data from HTML select options
            this.options = [];
            this.selObj.find('option').each(function () {
              var optObj = $(this);
              self.options.push({
                text: $.trim(optObj.text()),
                value: optObj.val(),
                selected: (optObj.attr('selected') == 'selected'),
                description: optObj.data('description'),
                imageSrc: optObj.data('imagesrc')
              });
            });

            // Hide select element
            this.selObj.hide();
            // Insert select replacement container
            this.ddListObj = $('<div id="ddList-' + this.selObj.attr('id') + '" class="ddListContainer"><a></a><span class="ddListArrow"></span><ul></ul></div>');
            this.ddListObj.insertAfter(this.selObj);
            // Get newly created <a> (shows selection) and <ul> (holds options) elements, set
            // their width and insert the <select> options
            var ddSelection = this.ddListObj.find('> a');
            ddSelection.css({ width: this.settings.width });
            var ddOptions = this.ddListObj.find('> ul');
            ddOptions.css({ width: this.settings.width });
            // Add options to <ul> element
            $.each(this.options, function (index, item) {
              if (item.selected) {
                self.settings.selectionIndex = index;
              }
              ddOptions.append('<li>' +
                                 '<a>' +
                                 (item.imageSrc ? ' <img' + (self.settings.imagePosition == "right" ? ' class="ddListImageRight"' : '') + ' src="' + item.imageSrc + '" />' : '') +
                                 (item.text ? ' <label>' + item.text + '</label>' : '') +
                                 (item.description ? ' <small>' + item.description + '</small>' : '') +
                                 '</a>' +
                               '</li>');
            });
            // Bind event handlers
            ddSelection.on('click.ddlist', function () {
              self._open();
            });
            ddOptions.find('a').on('click.ddlist', function () {
              // Select (new) index
              self._selectIndex($(this).closest('li').index());
              // Close
              self._close();
              // Callback function on selection
              self.settings.onSelected.call(self, self.selectedIndex, self.selectedValue, self.selectedText);
            });
            //Click anywhere to close
            this.ddListObj.on('click.ddlist', function (e) {
              e.stopPropagation();
            });
            $('body').on('click.ddlist', function () {
              self._close();
            });
            // Set 'Selection' element 
            this._selectIndex(this.settings.selectionIndex);
            if (this.settings.onSelectedOnInit) {
              // Callback function on selection
              this.settings.onSelected.call(this, this.selectedIndex, this.selectedValue, this.selectedText);
            }
        },

        // Select a given option
        // Arguments:
        // - argsArray: An array where the first element is an object in which the user can
        //              mark the item to be selected in 3 ways:
        //              - through property 'index'
        //              - through property 'text'.
        //              - through property 'value'.
        select: function (argsArray) {
            var arg = argsArray[0];
            if (arg.index) {
                this.settings.selectionIndex = arg.index;
                this._selectIndex(arg.index, false);
            }
            else if (arg.text) {
                // Find text in <select> element
                for (var i = 0; i < this.options.length; i++) {
                    if (this.options[i].text == arg.text) {
                        this.settings.selectionIndex = i;
                        this._selectIndex(i);
                        break;
                    }
                }
            }
            else if (arg.value) {
                // Find value in <select> element
                for (var i = 0; i < this.options.length; i++) {
                    if (this.options[i].value == arg.value) {
                        this.settings.selectionIndex = i;
                        this._selectIndex(i);
                        break;
                    }
                }
            }
        },

    };


    $.fn[pluginName] = function (methodOrOptions) {
      var instance = $(this).data(pluginName);
      if (instance && methodOrOptions.indexOf('_') != 0) {
        return instance[methodOrOptions](Array.prototype.slice.call(arguments, 1));
      }
      if (typeof methodOrOptions === 'object' || !methodOrOptions) {
        instance = new Plugin(this, methodOrOptions);
        $(this).data(pluginName, instance);
        return $(this);
      }
      $.error('Wrong call to ' + pluginName);
    };

})(jQuery);