// jQuery Context Menu Plugin
//
// Version 1.01
//
// Cory S.N. LaViska
// A Beautiful Site (http://abeautifulsite.net/)
//
// More info: http://abeautifulsite.net/2008/09/jquery-context-menu-plugin/
//
// Terms of Use
//
// This plugin is dual-licensed under the GNU General Public License
//   and the MIT License and is copyright A Beautiful Site, LLC.
//

if ($j) (function () {
  $j.extend($j.fn, {

    contextMenu: function (o, callback, beforeOpenCallback) {
      // Defaults
      if (o.menu == undefined) return false;
      if (o.inSpeed == undefined) o.inSpeed = 150;
      if (o.outSpeed == undefined) o.outSpeed = 75;
      // 0 needs to be -1 for expected results (no fade)
      if (o.inSpeed == 0) o.inSpeed = -1;
      if (o.outSpeed == 0) o.outSpeed = -1;
      // Loop each context menu
      $j(this).each(function () {
        var el = $j(this);
        var offset = $j(el).offset();
        // Add contextMenu class
        $j('#' + o.menu).addClass('contextMenu');
        // Simulate a true right click
        $j(this).mousedown(function (e) {
          var evt = e;
          evt.stopPropagation();
          $j(this).mouseup(function (e) {
            e.stopPropagation();
            var srcElement = $j(this);
            $j(this).unbind('mouseup');
            if (evt.button === 2) {
              // Hide context menus that may be showing
              $j(".contextMenu").hide();
              // Get this context menu
              var menu = $j('#' + o.menu);

              if ($j(el).hasClass('disabled')) return false;
              if (beforeOpenCallback) {
                beforeOpenCallback(el);
              }
              // Detect mouse position
              var d = {}, x, y;
              if (self.innerHeight) {
                d.pageYOffset = self.pageYOffset;
                d.pageXOffset = self.pageXOffset;
                d.innerHeight = self.innerHeight;
                d.innerWidth = self.innerWidth;
              } else if (document.documentElement &&
                document.documentElement.clientHeight) {
                d.pageYOffset = document.documentElement.scrollTop;
                d.pageXOffset = document.documentElement.scrollLeft;
                d.innerHeight = document.documentElement.clientHeight;
                d.innerWidth = document.documentElement.clientWidth;
              } else if (document.body) {
                d.pageYOffset = document.body.scrollTop;
                d.pageXOffset = document.body.scrollLeft;
                d.innerHeight = document.body.clientHeight;
                d.innerWidth = document.body.clientWidth;
              }
              (e.pageX) ? x = e.pageX : x = e.clientX + d.scrollLeft;
              (e.pageY) ? y = e.pageY : y = e.clientY + d.scrollTop;

              // Show the menu
              $j(document).unbind('click');
              $j(menu).css({ top: y, left: x }).fadeIn(o.inSpeed);

              // Keyboard
              $j(document).keypress(function (e) {
                switch (e.keyCode) {
                  case 38: // up
                    if ($j(menu).find('LI.hover').size() == 0) {
                      $j(menu).find('LI:last').addClass('hover');
                    } else {
                      $j(menu).find('LI.hover').removeClass('hover').prevAll('LI:not(.disabled)').eq(0).addClass('hover');
                      if ($j(menu).find('LI.hover').size() == 0) $j(menu).find('LI:last').addClass('hover');
                    }
                    break;
                  case 40: // down
                    if ($j(menu).find('LI.hover').size() == 0) {
                      $j(menu).find('LI:first').addClass('hover');
                    } else {
                      $j(menu).find('LI.hover').removeClass('hover').nextAll('LI:not(.disabled)').eq(0).addClass('hover');
                      if ($j(menu).find('LI.hover').size() == 0) $j(menu).find('LI:first').addClass('hover');
                    }
                    break;
                  case 13: // enter
                    $j(menu).find('LI.hover A').trigger('click');
                    break;
                  case 27: // esc
                    $j(document).trigger('click');
                    break
                }
              });

              // When items are selected
              $j('#' + o.menu).find('A').unbind('click');
              $j('#' + o.menu).find('LI:not(.disabled) A').click(function () {
                $j(document).unbind('click').unbind('keypress');
                $j(".contextMenu").hide();
                // Callback
                if (callback) callback($j(this).attr('href').substr(1), $j(srcElement), {
                  x: x - offset.left,
                  y: y - offset.top,
                  docX: x,
                  docY: y
                });
                return false;
              });

              // Hide bindings
              setTimeout(function () { // Delay for Mozilla
                $j(document).click(function () {
                  $j(document).unbind('click').unbind('keypress');
                  $j(menu).fadeOut(o.outSpeed);
                  return false;
                });
              }, 0);
            }
          });
        });

        // Disable text selection
        if ($j.browser.mozilla) {
          $j('#' + o.menu).each(function () {
            $j(this).css({ 'MozUserSelect': 'none' });
          });
        } else if ($j.browser.msie) {
          $j('#' + o.menu).each(function () {
            $j(this).bind('selectstart.disableTextSelect', function () {
              return false;
            });
          });
        } else {
          $j('#' + o.menu).each(function () {
            $j(this).bind('mousedown.disableTextSelect', function () {
              return false;
            });
          });
        }
        // Disable browser context menu (requires both selectors to work in IE/Safari + FF/Chrome)
        $j(el).add($j('UL.contextMenu')).bind('contextmenu', function () {
          return false;
        });

      });
      return $j(this);
    },

    // Disable context menu items on the fly
    disableContextMenuItems: function (o) {
      if (o == undefined) {
        // Disable all
        $j(this).find('LI').addClass('disabled');
        return ($j(this));
      }
      $j(this).each(function () {
        if (o != undefined) {
          var d = o.split(',');
          for (var i = 0; i < d.length; i++) {
            $j(this).find('a[href="' + d[i] + '"]').parent().addClass('disabled');

          }
        }
      });
      return ($j(this));
    },

    // Enable context menu items on the fly
    enableContextMenuItems: function (o) {
      if (o == undefined) {
        // Enable all
        $j(this).find('LI.disabled').removeClass('disabled');
        return ($j(this));
      }
      $j(this).each(function () {
        if (o != undefined) {
          var d = o.split(',');
          for (var i = 0; i < d.length; i++) {
            $j(this).find('A[href="' + d[i] + '"]').parent().removeClass('disabled');

          }
        }
      });
      return ($j(this));
    },

    // Disable context menu(s)
    disableContextMenu: function () {
      $j(this).each(function () {
        $j(this).addClass('disabled');
      });
      return ($j(this));
    },

    // Enable context menu(s)
    enableContextMenu: function () {
      $j(this).each(function () {
        $j(this).removeClass('disabled');
      });
      return ($j(this));
    },

    // Destroy context menu(s)
    destroyContextMenu: function () {
      // Destroy specified context menus
      $j(this).each(function () {
        // Disable action
        $j(this).unbind('mousedown').unbind('mouseup');
      });
      return ($j(this));
    }

  });
})($j);
