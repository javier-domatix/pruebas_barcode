/** @odoo-module **/

import { _t } from "@web/core/l10n/translation";
import { rpc } from "@web/core/network/rpc";
import { ConfirmationDialog } from "@web/core/confirmation_dialog/confirmation_dialog";
import { registry } from "@web/core/registry";
import { useBus, useService } from "@web/core/utils/hooks";
import { Component, onWillStart, useState } from "@odoo/owl";
import { standardActionServiceProps } from "@web/webclient/actions/action_service";
import { url } from '@web/core/utils/urls';

export class MainMenu extends Component {
    static props = { ...standardActionServiceProps };
    static components = {}
    static template = "disber_barcode.MainMenu";

    setup() {
        // const displayDemoMessage = this.props.action.params.message_demo_barcodes;
        this.actionService = useService('action');
        this.dialogService = useService("dialog");
        this.pwaService = useService("pwa");
    }
}

registry.category('actions').add('stock_barcode_main_menu', MainMenu);
