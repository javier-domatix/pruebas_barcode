/** @odoo-module **/

import { _t } from "@web/core/l10n/translation";
import { rpc } from "@web/core/network/rpc";
import { registry } from "@web/core/registry";
import { useBus, useService } from "@web/core/utils/hooks";
import { Component, onWillStart, useState } from "@odoo/owl";
import { ManualBarcodeScanner } from "../components/manual_barcode";
import { standardActionServiceProps } from "@web/webclient/actions/action_service";
import { url } from '@web/core/utils/urls';

export class PackageMovementMenu extends Component {
    static props = { ...standardActionServiceProps };
    static components = {}
    static template = "disber_barcode.PackageMovementMenu";

    setup() {
        this.actionService = useService('action');
        this.dialogService = useService("dialog");
        this.pwaService = useService("pwa");
        this.notificationService = useService("notification");
        this.barcodeService = useService('barcode');
        this.state = useState({});

        useBus(this.barcodeService.bus, "barcode_scanned", (ev) => this._onBarcodeScanned(ev.detail.barcode));

        onWillStart(async () => {
            const data = await rpc("/disber_barcode/get_main_menu_data");
            this.packagesEnabled = data.groups.package;
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

    playSound(soundName) {
        if (this.soundEnable) {
            this.sounds[soundName].currentTime = 0;
            this.sounds[soundName].play();
        }
    }

    async _onBarcodeScanned(barcode) {
        const res = await rpc('/disber_barcode/scan_from_package_movement_menu', { barcode });
        if (res.action) {
            this.playSound("success");
            return this.actionService.doAction(res.action);
        }
        this.notificationService.add(res.warning, { type: 'danger' });
    }
}

registry.category('actions').add('package_movement_menu_action', PackageMovementMenu);