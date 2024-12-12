/** @odoo-module **/

import { _t } from "@web/core/l10n/translation";
import { rpc } from "@web/core/network/rpc";
import { registry } from "@web/core/registry";
import { useBus, useService } from "@web/core/utils/hooks";
import { Component, onWillStart, useState } from "@odoo/owl";
import { standardActionServiceProps } from "@web/webclient/actions/action_service";
import { url } from '@web/core/utils/urls';

export class ShowDetailedPicking extends Component {
    static props = { ...standardActionServiceProps };
    static components = {};
    static template = "disber_barcode.ShowDetailedPicking";

    setup() {
        this.actionService = useService('action');
        this.dialogService = useService("dialog");
        this.pwaService = useService("pwa");
        this.notificationService = useService("notification");
        this.barcodeService = useService('barcode');
        this.state = useState({ 
            picking: null,
        });

        useBus(this.barcodeService.bus, "barcode_scanned", (ev) => this._onBarcodeScanned(ev.detail.barcode));

        onWillStart(async () => {
            const pickingId = this.props.action.params.picking_id;
            const data = await rpc("/disber_barcode/get_picking_info", { picking_id: pickingId });
            this.state.picking = data.picking;
            this.soundEnable = data.play_sound;
            if (this.soundEnable) {
                const fileExtension = new Audio().canPlayType("audio/ogg") ? "ogg" : "mp3";
                this.sounds = {
                    success: new Audio(url(`/disber_barcode/static/src/audio/success.${fileExtension}`)),
                };
                this.sounds.success.load();
            }
        });
    }

    playSound(soundName) {
        if (this.soundEnable) {
            this.sounds[soundName].currentTime = 0;
            this.sounds[soundName].play();
        }
    }

    async _onBarcodeScanned(barcode) {
        this.playSound("success");

        const data = await rpc("/disber_barcode/check_package", { 
            barcode: barcode,
            picking_id: this.state.picking.id 
        });
        
        if (data.error) {
            this.notificationService.add(data.error, { type: "danger" });
            return;
        }

        await this.actionService.doAction({
            type: 'ir.actions.act_window',
            res_model: 'stock.move.line.wizard',
            views: [[false, 'form']],
            target: 'new',
            context: {
                default_move_id: data.move_id || false, 
                default_quantity: data.quantity || 0,
                default_picking_id: data.picking_id || false,
                default_package_id: data.package_id || false,
                default_product_id: data.product_id || false,
                default_location_id: data.location_id || false,
                default_location_dest_id: data.location_dest_id || false,
                default_lot_id: data.lot_id || false,
                default_quant_id: data.quant_id || false,
            },
        });
        
    }
}

registry.category('actions').add('detailed_picking_menu_action', ShowDetailedPicking);