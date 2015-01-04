/****************************************************************************************************** 
 * A jquery plugin implementing a styleable dropdown list
 * 
 * Version 1.1.0
 *
 * This plugin is developed with ddslick as example (See http://designwithpc.com/Plugins/ddslick), but
 * improved in some areas; particularly where ddslick lacks support for posting the "selected" option
 * to the server when the <select> (with <option> elements) is part of a form. As with ddslick it is
 * also possible to provide the list items using a json array/object with the added feature that the
 * items can also be set using a plugin method.
 * The idea to also support images (and description) using HTML5 data-imagesrc (and data-description)
 * is also completely based on ddslick.
 * This plugin is a bit simpler with respect to the classes that it injects in the DOM. Styling
 * is also assumed to be handled by a very limited set of classes in CSS.
 * 
 * Usage:
 *  - Instantiation 1 (using a <select> with one or more <option> elements):
 *      $('#dd').ddlist({ onSelect: function (index, text, value) { ... }
 *      });
 *  - Instantiation 2: (using an empty <select> with a json array containing the options 
 *      $('#dd').ddlist({ itemsSource: jsonDataArray,
 *                        onSelect: function (index, text, value) { ... }
 *      });
 *  - External methods:
 *      $('#dd').ddlist('select', { index: index [, text: string] [, value: string] });
 *      $('#dd').ddlist('enable', true/false);
 *      $('#dd').ddlist('setItemsSource', jsonDataArray);
 *
 * Change history:
 *
 * Version 1.1.0 - Added possibility to offer list data 'options' through JSON.
 *                 Added support for 'disabled' attribute in <select>.
 * Version 1.0.0 - First version.
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
    var ENTER = 13,
        ESCAPE = 27,
        SPACE = 32,
        UP = 38,
        DOWN = 40;

    function Plugin(element, options) {
        // Get the main element
        this.element = element;
        this.selObj = $(element);
        this.settings = {
            width: 260,
            selectionIndex: 0,
            disabled: false,
            showSelectionTextOnly: false,
            onSelectedOnInit: false,
            onSelected: function (index, value, text) { },
            itemsSource: null
        };
        this._init(options);
    };

    Plugin.prototype = {

        // Select index
        _selectIndex: function(index) {
            // Remove current 'ddListOptionIsSelected' class
            this.ddOptions.find('a').removeClass('ddListOptionIsSelected');

            // Set 'ddListOptionIsSelected' class to element that corresponds with index
            var selectedOption = this.ddOptions.find('a').eq(index);
            selectedOption.addClass('ddListOptionIsSelected');

            // Update selected index/value/text 
            var optionData = this.options[index];
            this.selectedIndex = index;
            this.selectedValue = optionData.value;
            this.selectedText = optionData.text;

            // Update <select> element (if we are not dealing with json-provided data)
            if (this.settings.itemsSource == null) {
                // Clear current 'selected'
                this.selObj.find('option').attr('selected', false);
                // Set new 'selected'
                var selOption = this.selObj.find('option').eq(index);
                selOption.attr('selected', true);
            }

            // Update ddListSelection element
            if (this.settings.showSelectionTextOnly) {
                this.ddSelection.html(optionData.text);
            }
            else {
                this.ddSelection.html((optionData.imageSrc ? '<img src="' + optionData.imageSrc + '" />' : '') +
                                      (optionData.text ? '<label>' + optionData.text + '</label>' : '') +
                                      (optionData.description ? '<small>' + optionData.description + '</small>' : ''));
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

        _close: function () {
            // Close drop down
            this.ddListObj.removeClass('ddListIsOpen');
            this.ddListObj.find('> ul').slideUp(50);
        },

        _enable: function () {
            var self = this;
            this.settings.disabled = false;
            this.ddListObj.removeClass('ddListDisabled');
            // Bind event handlers
            this.ddSelection.on('click.ddlist', function () {
                self._open();
            });
            this.ddOptions.find('a').on('click.ddlist', function () {
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
            $('body').on('click.ddlist-' + this.selObj.attr('id'), function () {
                self._close();
            });
        },

        _disable: function () {
            this.settings.disabled = true;
            // Unbind event handlers
            $('body').off('.ddlist-' + this.selObj.attr('id'));
            this.ddListObj.off('.ddlist');
            this.ddOptions.find('a').off('.ddlist');
            this.ddSelection.off('.ddlist');
            this.ddListObj.addClass('ddListDisabled');
        },

        // Add items to the ddOptions list
        _bindListItems: function (disableAccess) {
            var self = this;
            // Add options to <ul> element
            $.each(this.options, function (index, item) {
                if (item.selected) {
                    self.settings.selectionIndex = index;
                }
                self.ddOptions.append('<li>' +
                                        '<a>' +
                                          (item.imageSrc ? ' <img src="' + item.imageSrc + '" />' : '') +
                                          (item.text ? ' <label>' + item.text + '</label>' : '') +
                                          (item.description ? ' <small>' + item.description + '</small>' : '') +
                                        '</a>' +
                                      '</li>');
            });

            // Bind event handlers
            if (!disableAccess) {
                this._enable();
            }
            else {
                this.ddListObj.addClass('ddListDisabled');
            }

            // Show 'selected' item in the top selection element
            this._selectIndex(this.settings.selectionIndex);

            // Invoke 'onSelected' callback (unless configured not to do that during initialization)
            if (this.settings.onSelectedOnInit) {
                this.settings.onSelected.call(this, this.selectedIndex, this.selectedValue, this.selectedText);
            }
        },

        // Unbind event handlers and remove items from the ddOptions list
        _unbindListItems: function () {
            this._disable();
            this.ddOptions.empty();
        },

        // Initialize 
        _init: function (options) {
            this.settings = $.extend({}, this.settings, options);
            var self = this;

            // Load data from HTML select options or from a user-provided json object
            // in a list options data array
            this.options = [];
            if (this.settings.itemsSource == null) {
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
            }
            else {
                this.options = this.settings.itemsSource;
            }

            // Hide select element
            this.selObj.hide();
            // Insert select replacement container
            this.ddListObj = $('<div id="ddList-' + this.selObj.attr('id') + '" class="ddListContainer"><a></a><span class="ddListArrow"></span><ul></ul></div>');
            this.ddListObj.insertAfter(this.selObj);
            // Get newly created <a> element (which shows the selected item) and set its width
            this.ddSelection = this.ddListObj.find('> a');
            this.ddSelection.css({ width: this.settings.width });
            // Get newly created <ul> element (which will hold the list options) and set its width
            this.ddOptions = this.ddListObj.find('> ul');
            this.ddOptions.css({ width: this.settings.width });

            // Insert all list items, bind event handlers and set 'selected' item
            if (!this.settings.disabled) {
                this.settings.disabled = this.selObj.is(':disabled');
            }
            this._bindListItems(this.settings.disabled);
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
                // Find text in the list options data array
                for (var i = 0; i < this.options.length; i++) {
                    if (this.options[i].text == arg.text) {
                        this.settings.selectionIndex = i;
                        this._selectIndex(i);
                        break;
                    }
                }
            }
            else if (arg.value) {
                // Find value in the list options data array
                for (var i = 0; i < this.options.length; i++) {
                    if (this.options[i].value == arg.value) {
                        this.settings.selectionIndex = i;
                        this._selectIndex(i);
                        break;
                    }
                }
            }
        },

        // Enable/disable dropdown
        // Arguments:
        // - argsArray: An array where the first element is an boolean.
        //              - When set to true the dropdown list is enabled
        //              - When set to false the dropdown list is disabled
        enable: function (argsArray) {
            var isEnable = argsArray[0];
            if (isEnable) {
                this._enable();
            }
            else {
                this._disable();
            }
        },

        // isDisabled
        isDisabled: function () {
            return this.settings.disabled;
        },

        // setItemsSource
        // Arguments:
        // - argsArray: An array where the first element is a reference to a json
        //              ItemsSource array.
        setItemsSource: function (argsArray) {
            // Remove event handlers and unbind the current list items
            var disableAccess = this.settings.disabled;
            this._unbindListItems();
            // Set itemsSource
            this.options = argsArray[0];
            // Insert all list items, bind event handlers and set 'selected' item
            this._bindListItems(disableAccess);
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