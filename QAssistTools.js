/**
 * @Description 网站开发常用方法效果
 * @version 1.0.0.0
 * @author SmallQ
 * @date 2013-6-24
 * Use Jquery 1.7.2 or later
 */

/*-----------------------------Jquery 鼠标滚轮事件------------------------*/
/*! Copyright (c) 2013 Brandon Aaron (http://brandon.aaron.sh)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Version: 3.1.11
 *
 * Requires: jQuery 1.2.2+
 */

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // Node/CommonJS style for Browserify
        module.exports = factory;
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {

    var toFix = ['wheel', 'mousewheel', 'DOMMouseScroll', 'MozMousePixelScroll'],
        toBind = ('onwheel' in document || document.documentMode >= 9) ?
                    ['wheel'] : ['mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'],
        slice = Array.prototype.slice,
        nullLowestDeltaTimeout, lowestDelta;

    if ($.event.fixHooks) {
        for (var i = toFix.length; i;) {
            $.event.fixHooks[toFix[--i]] = $.event.mouseHooks;
        }
    }

    var special = $.event.special.mousewheel = {
        version: '3.1.11',

        setup: function () {
            if (this.addEventListener) {
                for (var i = toBind.length; i;) {
                    this.addEventListener(toBind[--i], handler, false);
                }
            } else {
                this.onmousewheel = handler;
            }
            // Store the line height and page height for this particular element
            $.data(this, 'mousewheel-line-height', special.getLineHeight(this));
            $.data(this, 'mousewheel-page-height', special.getPageHeight(this));
        },

        teardown: function () {
            if (this.removeEventListener) {
                for (var i = toBind.length; i;) {
                    this.removeEventListener(toBind[--i], handler, false);
                }
            } else {
                this.onmousewheel = null;
            }
            // Clean up the data we added to the element
            $.removeData(this, 'mousewheel-line-height');
            $.removeData(this, 'mousewheel-page-height');
        },

        getLineHeight: function (elem) {
            var $parent = $(elem)['offsetParent' in $.fn ? 'offsetParent' : 'parent']();
            if (!$parent.length) {
                $parent = $('body');
            }
            return parseInt($parent.css('fontSize'), 10);
        },

        getPageHeight: function (elem) {
            return $(elem).height();
        },

        settings: {
            adjustOldDeltas: true, // see shouldAdjustOldDeltas() below
            normalizeOffset: true  // calls getBoundingClientRect for each event
        }
    };

    $.fn.extend({
        mousewheel: function (fn) {
            return fn ? this.bind('mousewheel', fn) : this.trigger('mousewheel');
        },

        unmousewheel: function (fn) {
            return this.unbind('mousewheel', fn);
        }
    });


    function handler(event) {
        var orgEvent = event || window.event,
            args = slice.call(arguments, 1),
            delta = 0,
            deltaX = 0,
            deltaY = 0,
            absDelta = 0,
            offsetX = 0,
            offsetY = 0;
        event = $.event.fix(orgEvent);
        event.type = 'mousewheel';

        // Old school scrollwheel delta
        if ('detail' in orgEvent) { deltaY = orgEvent.detail * -1; }
        if ('wheelDelta' in orgEvent) { deltaY = orgEvent.wheelDelta; }
        if ('wheelDeltaY' in orgEvent) { deltaY = orgEvent.wheelDeltaY; }
        if ('wheelDeltaX' in orgEvent) { deltaX = orgEvent.wheelDeltaX * -1; }

        // Firefox < 17 horizontal scrolling related to DOMMouseScroll event
        if ('axis' in orgEvent && orgEvent.axis === orgEvent.HORIZONTAL_AXIS) {
            deltaX = deltaY * -1;
            deltaY = 0;
        }

        // Set delta to be deltaY or deltaX if deltaY is 0 for backwards compatabilitiy
        delta = deltaY === 0 ? deltaX : deltaY;

        // New school wheel delta (wheel event)
        if ('deltaY' in orgEvent) {
            deltaY = orgEvent.deltaY * -1;
            delta = deltaY;
        }
        if ('deltaX' in orgEvent) {
            deltaX = orgEvent.deltaX;
            if (deltaY === 0) { delta = deltaX * -1; }
        }

        // No change actually happened, no reason to go any further
        if (deltaY === 0 && deltaX === 0) { return; }

        // Need to convert lines and pages to pixels if we aren't already in pixels
        // There are three delta modes:
        //   * deltaMode 0 is by pixels, nothing to do
        //   * deltaMode 1 is by lines
        //   * deltaMode 2 is by pages
        if (orgEvent.deltaMode === 1) {
            var lineHeight = $.data(this, 'mousewheel-line-height');
            delta *= lineHeight;
            deltaY *= lineHeight;
            deltaX *= lineHeight;
        } else if (orgEvent.deltaMode === 2) {
            var pageHeight = $.data(this, 'mousewheel-page-height');
            delta *= pageHeight;
            deltaY *= pageHeight;
            deltaX *= pageHeight;
        }

        // Store lowest absolute delta to normalize the delta values
        absDelta = Math.max(Math.abs(deltaY), Math.abs(deltaX));

        if (!lowestDelta || absDelta < lowestDelta) {
            lowestDelta = absDelta;

            // Adjust older deltas if necessary
            if (shouldAdjustOldDeltas(orgEvent, absDelta)) {
                lowestDelta /= 40;
            }
        }

        // Adjust older deltas if necessary
        if (shouldAdjustOldDeltas(orgEvent, absDelta)) {
            // Divide all the things by 40!
            delta /= 40;
            deltaX /= 40;
            deltaY /= 40;
        }

        // Get a whole, normalized value for the deltas
        delta = Math[delta >= 1 ? 'floor' : 'ceil'](delta / lowestDelta);
        deltaX = Math[deltaX >= 1 ? 'floor' : 'ceil'](deltaX / lowestDelta);
        deltaY = Math[deltaY >= 1 ? 'floor' : 'ceil'](deltaY / lowestDelta);

        // Normalise offsetX and offsetY properties
        if (special.settings.normalizeOffset && this.getBoundingClientRect) {
            var boundingRect = this.getBoundingClientRect();
            offsetX = event.clientX - boundingRect.left;
            offsetY = event.clientY - boundingRect.top;
        }

        // Add information to the event object
        event.deltaX = deltaX;
        event.deltaY = deltaY;
        event.deltaFactor = lowestDelta;
        event.offsetX = offsetX;
        event.offsetY = offsetY;
        // Go ahead and set deltaMode to 0 since we converted to pixels
        // Although this is a little odd since we overwrite the deltaX/Y
        // properties with normalized deltas.
        event.deltaMode = 0;

        // Add event and delta to the front of the arguments
        args.unshift(event, delta, deltaX, deltaY);

        // Clearout lowestDelta after sometime to better
        // handle multiple device types that give different
        // a different lowestDelta
        // Ex: trackpad = 3 and mouse wheel = 120
        if (nullLowestDeltaTimeout) { clearTimeout(nullLowestDeltaTimeout); }
        nullLowestDeltaTimeout = setTimeout(nullLowestDelta, 200);

        return ($.event.dispatch || $.event.handle).apply(this, args);
    }

    function nullLowestDelta() {
        lowestDelta = null;
    }

    function shouldAdjustOldDeltas(orgEvent, absDelta) {
        // If this is an older event and the delta is divisable by 120,
        // then we are assuming that the browser is treating this as an
        // older mouse wheel event and that we should divide the deltas
        // by 40 to try and get a more usable deltaFactor.
        // Side note, this actually impacts the reported scroll distance
        // in older browsers and can cause scrolling to be slower than native.
        // Turn this off by setting $.event.special.mousewheel.settings.adjustOldDeltas to false.
        return special.settings.adjustOldDeltas && orgEvent.type === 'mousewheel' && absDelta % 120 === 0;
    }

}));



/*-----------------------------Jquery 对象扩展------------------------*/
$.QAssistTools = {};

/* *
 * 字符处理
 */
$.QAssistTools.StrHelper = {
    /**
     * @Description 字符格式化，类似.net的string.Format
     * @version 1.0.0.0
     * @author SmallQ
     * @date 2013-6-24
     */
    format: function () {
        if (arguments.length == 0)
            return null;

        var str = arguments[0];
        for (var i = 1; i < arguments.length; i++) {
            var re = new RegExp('\\{' + (i - 1) + '\\}', 'gm');
            str = str.replace(re, arguments[i]);
        }
        return str;
    }
};

/**
 * @Description 无障碍浏览(辅助线)
 * @version 1.0.0.0
 * @author SmallQ
 * @date 2013-6-24
 * @Usage
 *  $.QAssistTools.Accessible.CreateAitLine();//添加辅助线
 *  $.QAssistTools.Accessible.RemoveAitLine();//移除辅助线
 * @options
 *  lineHeight: 4,//线宽度
 *  lineSkew: 5//坐标离鼠标偏移量
 */
$.QAssistTools.Accessible = {
    sx: null,
    hx: null,

    //创建辅助线
    CreateAitLine: function (options) {
        if (this.sx != null || this.hx != null) {
            return;
        }

        //默认参数
        var defaults = {
            lineHeight: 4,//线宽度
            lineSkew: 5//坐标离鼠标偏移量
        };

        var opts = $.extend(defaults, options);

        var linebase = "<div style=\"overflow: hidden;position: absolute; left: {2}px; top: {3}px; width: {0}px; background-color: #F00; height: {1}px; z-index: 999;\">";

        this.sx = $($.QAssistTools.StrHelper.format(linebase, opts.lineHeight, $(window).height(), 0, 0)).appendTo($("body"));
        this.hx = $($.QAssistTools.StrHelper.format(linebase, $(window).width(), opts.lineHeight, 0, 0)).appendTo($("body"));

        //绑定辅助线移动事件
        $(document).bind("mousemove", function (e) {
            $.QAssistTools.Accessible.hx.css("top", e.pageY + opts.lineSkew);
            $.QAssistTools.Accessible.sx.css("left", e.pageX + opts.lineSkew);
            $.QAssistTools.Accessible.hx.css("width", $(window).width());
            $.QAssistTools.Accessible.sx.css("height", $(window).height());
        });
    },

    //删除辅助线
    RemoveAitLine: function () {
        this.sx.remove();
        this.hx.remove();
        this.sx = this.hx = null;
        $(document).unbind("mousemove");
    }
};

/*------------------------------Jquery DOM 对象扩展------------------------*/
(function ($) {
    /**
     * @Description 设置背景色
     * @version 1.0.0.0
     * @author SmallQ
     * @date 2013-6-24
     * @Usage
     *  $("#div1").SqSetBackGround("#F00");//设置背景色
     * @options
     *  color: #F00,//颜色
     */
    $.fn.SqSetBackGround = function (color) {
        $(this).css("background-color", color);
    };

    /**
     * @Description 设置字体大小
     * @version 1.0.0.0
     * @author SmallQ
     * @date 2013-6-24
     * @Usage
     *  $("#div1").SqSetFontSize(12);//设置背景色
     * @options
     *  size: 12,//字体大小
     */
    $.fn.SqSetFontSize = function (size) {
        $(this).css("font-size", size);
    };

    /**
     * @Description 关键字标红
     * @version 1.0.0.0
     * @author SmallQ
     * @date 2013-6-24
     * @Usage
     *  $("#div1").SetKeyWord(new Array('keyword1','keyword2'));//设置背景色
     * @options
     *  ArrayKeyWord : new Array('keyword1','keyword2');//关键字数组
     */
    $.fn.SetKeyWord = function (ArrayKeyWord) {
        $(this).each(function () {
            var position = new Array();
            var content = $(this).html();

            for (var i = 0; i < ArrayKeyWord.length; i++) {
                var regstr = new RegExp(ArrayKeyWord[i], "gi");
                var m;
                while ((m = regstr.exec(content)) != null) {
                    position[m.index] = m.index + "|" + ArrayKeyWord[i].length;
                }
            }

            for (var i = position.length - 1; i >= 0; i--) {
                if (position[i] == null) {
                    position.splice(i, 1);
                }
            }

            for (var i = position.length - 1; i >= 0; i--) {
                var strsp = position[i].split("|");
                var begstr = content.substr(0, strsp[0]);
                var repstr = "<font style='color:#F00'>" + content.substr(strsp[0], strsp[1]) + "</font>";
                var endstr = content.substring(parseInt(strsp[0], 10) + parseInt(strsp[1], 10), content.length);
                content = begstr + repstr + endstr;
            }

            $(this).html(content);
        });
    };

    /**
     * @classDescription 无间断滚动内容
     * @version 1.0.0.0
     * @author SmallQ
     * @date 2013-6-24
     * @DOM
     * <div id="div1">
     *   <div class="div1n">
     *   </div>
     *</div>
     * @CSS
     *    #div1 {width:200px;height:50px;overflow:hidden;}
     *    .div1n {float:left;white-space: nowrap;}
     * @Usage
     *    $("#div1").Marquee(options);
     * @options
     *        direction: 'left',//滚动方向，'left','right','up','down'
     *        scrollAmount:1,//步长
     *        scrollDelay:20//时长
     */
    $.fn.Marquee = function (options) {
        var defaults = {
            direction: "left",//滚动方向，'left','right','up','down'
            scrollAmount: 1,//步长
            scrollDelay: 20//时长
        };

        var opts = $.extend(defaults, options);

        //基础结构创建
        var obj = $(this);//容器
        var childobj = obj.children();//容器内子元素
        var _type = (opts.direction == "left" || opts.direction == "right") ? 1 : 0;//滚动类型，1左右，0上下
        var childSize = _type == 1 ? childobj.width() : childobj.height();
        var scrollSize = (opts.direction == "right" || opts.direction == "down") ? -opts.scrollAmount : opts.scrollAmount;

        //滚动执行
        if (childSize <= (_type ? obj.width() : obj.height())) return;//子元素没有产生指定的溢出时不滚动

        if (_type) {
            childobj.append(childobj.html());
        } else {
            obj.append(childobj.clone());
        }

        function scrollFunc() {
            if (_type) {
                if (scrollSize < 0) {
                    obj.scrollLeft() <= 0 ? obj.scrollLeft(childSize) : obj.scrollLeft(obj.scrollLeft() + scrollSize);
                } else {
                    obj.scrollLeft() >= childSize ? obj.scrollLeft(0) : obj.scrollLeft(obj.scrollLeft() + scrollSize);
                }
            } else {
                if (scrollSize < 0) {
                    obj.scrollTop() <= 0 ? obj.scrollTop(childSize) : obj.scrollTop(obj.scrollTop() + scrollSize);
                } else {
                    obj.scrollTop() >= childSize ? obj.scrollTop(0) : obj.scrollTop(obj.scrollTop() + scrollSize);
                }
            }
        }

        //滚动计时器
        var moveId = setInterval(scrollFunc, opts.scrollDelay);

        obj.hover(
            function () {
                clearInterval(moveId);
            },
            function () {
                clearInterval(moveId);
                moveId = setInterval(scrollFunc, opts.scrollDelay);
            }
        );
    };
})(jQuery);
