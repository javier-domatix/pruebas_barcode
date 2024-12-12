/** @odoo-module **/

import { _t } from "@web/core/l10n/translation";
import { rpc } from "@web/core/network/rpc";
import { registry } from "@web/core/registry";
import { useBus, useService } from "@web/core/utils/hooks";
import { Component, onWillStart, useState } from "@odoo/owl";
import { standardActionServiceProps } from "@web/webclient/actions/action_service";

export class ShowPickings extends Component {
    static props = { ...standardActionServiceProps };
    static components = {}
    static template = "disber_barcode.ShowPickings";

    setup() {
        this.actionService = useService('action');
        this.dialogService = useService("dialog");
        this.pwaService = useService("pwa");
        this.notificationService = useService("notification");
        this.barcodeService = useService('barcode');
        this.state = useState({ 
            pickings: []
        });

        onWillStart(async () => {
            const data = await rpc("/disber_barcode/get_pickings");
            this.state.pickings = data.pickings;
        });
    }

    openPickingForm = (pickingId) => {
        this.actionService.doAction({
            type: 'ir.actions.client',
            tag: 'detailed_picking_menu_action',
            params: {
                picking_id: pickingId,
            },
        });
    }

}

registry.category('actions').add('pickings_menu_action', ShowPickings);