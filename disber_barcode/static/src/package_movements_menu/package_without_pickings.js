/** @odoo-module **/

import { _t } from "@web/core/l10n/translation";
import { rpc } from "@web/core/network/rpc";
import { registry } from "@web/core/registry";
import { useBus, useService } from "@web/core/utils/hooks";
import { Component, onWillStart, useState } from "@odoo/owl";
import { standardActionServiceProps } from "@web/webclient/actions/action_service";

export class PackageWithoutPickings extends Component {
    static props = { ...standardActionServiceProps };
    static components = {}
    static template = "disber_barcode.PackageWithoutPickings";

    setup() {
        this.actionService = useService('action');
        this.dialogService = useService("dialog");
        this.pwaService = useService("pwa");
        this.notificationService = useService("notification");
        this.barcodeService = useService('barcode');
        const packageData = this.props.action?.context?.package || {};
        this.state = useState({ package: packageData });

        onWillStart(async () => {
            const data = await rpc("/disber_barcode/get_main_menu_data");
            this.packagesEnabled = data.groups.package;
        });
    }

    moveToWarehouse() {
        this.actionService.doAction('disber_barcode.stock_barcode_action_move_to_warehouse', {
            additionalContext: {
                package: this.state.package,
            },
        });
    }
}

registry.category('actions').add('package_without_pickings_menu_action', PackageWithoutPickings);