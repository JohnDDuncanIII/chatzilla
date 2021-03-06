/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*-
 *
 * The contents of this file are subject to the Mozilla Public License
 * Version 1.1 (the "License"); you may not use this file except in
 * compliance with the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is ChatZilla
 *
 * The Initial Developer of the Original Code is
 * Samuel Sieb
 * Portions created by Samuel Sieb are Copyright (C) 2004 Samuel Sieb.
 *
 * Alternatively, the contents of this file may be used under the
 * terms of the GNU Public License (the "GPL"), in which case the
 * provisions of the GPL are applicable instead of those above.
 * If you wish to allow use of your version of this file only
 * under the terms of the GPL and not to allow others to use your
 * version of this file under the MPL, indicate your decision by
 * deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL.  If you do not delete
 * the provisions above, a recipient may use your version of this
 * file under either the MPL or the GPL.
 *
 * Contributor(s):
 *  Samuel Sieb, <samuel@sieb`net>, original author
 */

const __id = "userlist-mover";
const __maj_version = 1
const __min_version = 0
const __description = "Moves the userlist to the right side.  May be "+
                      "disabled to put the userlist back to the left side.";

function initPlugin(glob)
{
    /* This function will be called when chatzilla first loads the plugin.
     * We initialize some of the plugin object's properties, define a new
     * command and some new prefs, and print out a message.
     */
    plugin.id = __id;
    plugin.major = __maj_version;
    plugin.minor = __min_version;
    plugin.version = __maj_version + "." + __min_version
    plugin.description = __description;

    plugin.switched = false;
    enablePlugin();

    display(__id + " loaded from url " + plugin.url);
}

function disablePlugin(status)
{
    if (!plugin.switched){
      display("The userlist is already on the left side");
      return;
    }
    display("Moving userlist back to the left side.");
    plugin.switched = false;
    var box = plugin.myBox;
    box.insertBefore(box.childNodes[1], box.childNodes[0]);
    box.insertBefore(box.childNodes[2], box.childNodes[0]);
    box.childNodes[1].setAttribute('collapse', 'before');
}

function enablePlugin(status)
{
    if (plugin.switched){
      display("The userlist is already on the right side");
      return;
    }
    display("Moving userlist to the right side.");
    plugin.switched = true;
    var box = document.getElementById('tabpanels-contents-box');
    plugin.myBox = box;
    box.appendChild(box.childNodes[1]);
    box.appendChild(box.childNodes[0]);
    box.childNodes[1].setAttribute('collapse', 'after');
}

