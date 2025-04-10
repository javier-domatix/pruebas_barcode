/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { ChatWindow } from "@mail/core/common/chat_window_model";

patch(ChatWindow, {
    insert() {
        console.log(this.env.services.orm.user.context.disable_popups_notifications);
        if (!this.env.services.orm.user.context.disable_popups_notifications) {
            return this._insert(...arguments);
        }
    }
});
