/** @odoo-module **/

import { _t } from "@web/core/l10n/translation";
import { rpc } from "@web/core/network/rpc";
import { registry } from "@web/core/registry";
import { useBus, useService } from "@web/core/utils/hooks";
import { Component, onWillStart, useState } from "@odoo/owl";
import { ManualBarcodeScanner } from "../components/manual_barcode";
import { standardActionServiceProps } from "@web/webclient/actions/action_service";
import { url } from '@web/core/utils/urls';

export class StockMenu extends Component {
    static props = { ...standardActionServiceProps };
    static components = {}
    static template = "disber_barcode.StockMenu";

    setup() {
        this.actionService = useService('action');
        this.dialogService = useService("dialog");
        this.pwaService = useService("pwa");
        this.notificationService = useService("notification");
        this.barcodeService = useService('barcode');
        const displayDemoMessage = this.props.action?.params?.message_demo_barcodes || false;
        this.state = useState({ displayDemoMessage });

        useBus(this.barcodeService.bus, "barcode_scanned", (ev) => this._onBarcodeScanned(ev.detail.barcode));

        onWillStart(async () => {
            const data = await rpc("/disber_barcode/get_main_menu_data");
            this.locationsEnabled = data.groups.locations;
            this.packagesEnabled = data.groups.package;
            this.trackingEnabled = data.groups.tracking;
            this.quantCount = data.quant_count;
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

    logout() {
        window.open(`/web/session/logout${ this.pwaService.isScopedApp ? "?redirect=scoped_app/barcode" : "" }`, "_self");
    }

    openManualBarcodeDialog() {
        let res;
        let rej;
        const promise = new Promise((resolve, reject) => {
            res = resolve;
            rej = reject;
        });
        this.dialogService.add(ManualBarcodeScanner, {
            facingMode: "environment",
            onResult: (barcode) => {
                this._onBarcodeScanned(barcode);
                res(barcode);
            },
            onError: (error) => rej(error),
        });
        promise.catch(error => this.notificationService.add(error.message, { type: 'danger' }));
        return promise;
    }

    removeDemoMessage() {
        this.state.displayDemoMessage = false;
        const params = {
            title: _t("Don't show this message again"),
            body: _t("Do you want to permanently remove this message ? " +
                    "It won't appear anymore, so make sure you don't need the barcodes sheet or you have a copy."),
            confirm: () => {
                rpc('/disber_barcode/rid_of_message_demo_barcodes');
                location.reload();
            },
            cancel: () => {},
            confirmLabel: _t("Remove it"),
            cancelLabel: _t("Leave it"),
        };
        this.dialogService.add(ConfirmationDialog, params);
    }

    playSound(soundName) {
        if (this.soundEnable) {
            this.sounds[soundName].currentTime = 0;
            this.sounds[soundName].play();
        }
    }

    async _onBarcodeScanned(barcode) {
        const res = await rpc('/disber_barcode/scan_from_stock_menu', { barcode });
        if (res.action) {
            this.playSound("success");
            return this.actionService.doAction(res.action);
        }
        this.notificationService.add(res.warning, { type: 'danger' });
    }
}

registry.category('actions').add('stock_barcode_menu_action', StockMenu);