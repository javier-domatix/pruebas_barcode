/** @odoo-module **/

import { _t } from "@web/core/l10n/translation";
import { rpc } from "@web/core/network/rpc";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { Component, onWillStart, useState } from "@odoo/owl";
import { standardActionServiceProps } from "@web/webclient/actions/action_service";

export class PackageMoveToWarehouse extends Component {
    static props = { ...standardActionServiceProps };
    static components = {}
    static template = "disber_barcode.PackageMoveToWarehouse";

    setup() {
        this.actionService = useService('action');
        this.dialogService = useService("dialog");
        this.pwaService = useService("pwa");
        this.notificationService = useService("notification");
        const packageData = this.props.action?.context?.package || {};
        this.state = useState({
            warehouses: [],
            locations: [],
            warehouse_id: null,
            location_id: null,
            package: packageData,
        });

        onWillStart(async () => {
            const data = await rpc("/disber_barcode/get_warhouses_and_locations");
            this.state.warehouses = data.warehouses;
            this.state.locations = data.locations;
        });
    }

    onWarehouseChange(event) {
        this.state.warehouse_id = parseInt(event.target.value);
    }

    onLocationChange(event) {
        this.state.location_id = parseInt(event.target.value);
    }

    async movePackage() {
        const package_id = this.state.package.id;
        const warehouse_id = this.state.warehouse_id;
        const location_id = this.state.location_id;
        if (!package_id || !warehouse_id || !location_id) {
            this.notificationService.add(("Porfavor seleccione un almacén y ubicación destino"), { type: 'warning' });
            return;
        }

        const result = await rpc("/disber_barcode/create_internal_transfer", {
            package_id: package_id,
            warehouse_id: warehouse_id,
            location_id: location_id,
        });

        if (result.error) {
            this.notificationService.add(_t(result.error), { type: 'danger' });
        } else {
            this.notificationService.add("Transferencia creada correctamente", { type: 'success' });
            this.actionService.doAction('disber_barcode.stock_barcode_action_main_menu');
        }
    }
}

registry.category('actions').add('move_to_warehouse_menu_action', PackageMoveToWarehouse);