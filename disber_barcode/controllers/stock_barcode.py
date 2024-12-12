# Part of Odoo. See LICENSE file for full copyright and licensing details.

from collections import defaultdict

from odoo import fields, http, _
from odoo.http import request
from odoo.exceptions import UserError


class StockBarcodeController(http.Controller):

    @http.route('/disber_barcode/get_main_menu_data', type='json', auth='user')
    def get_main_menu_data(self):
        user = request.env.user
        groups = {
            'locations': user.has_group('stock.group_stock_multi_locations'),
            'package': user.has_group('stock.group_tracking_lot'),
            'tracking': user.has_group('stock.group_production_lot'),
        }
        quant_count = request.env['stock.quant'].search_count([
            ("user_id", "=?", user.id),
            ("location_id.usage", "in", ["internal", "transit"]),
            ("inventory_date", "<=", fields.Date.context_today(user)),
        ])
        mute_sound = request.env['ir.config_parameter'].sudo().get_param('stock_barcode.mute_sound_notifications')
        play_sound = bool(not mute_sound or mute_sound == "False")
        return {
            'groups': groups,
            'play_sound': play_sound,
            'quant_count': quant_count,
        }
      
    @http.route('/disber_barcode/scan_from_package_movement_menu', type='json', auth='user')
    def scan_from_package_movement(self, barcode):
        
        ret_open_package = self._try_open_package_picking(barcode)
        if ret_open_package:
            return ret_open_package

        return {'warning': _('No hay ningún paquete que corresponda con el código: %(barcode)s', barcode=barcode)}
    
    @http.route('/disber_barcode/create_internal_transfer', type='json', auth='user')
    def create_internal_transfer(self, package_id, warehouse_id, location_id):
        package = request.env['stock.quant.package'].browse(package_id)
        if not package:
            return {'error': 'Paquete no encontrado'}

        warehouse = request.env['stock.warehouse'].browse(warehouse_id)
        if not warehouse:
            return {'error': 'Almacén no encontrado'}

        location = request.env['stock.location'].browse(location_id)
        if not location:
            return {'error': 'Ubicación no encontrada'}

        picking_type = request.env['stock.picking.type'].search([
            ('code', '=', 'internal'),
            ('warehouse_id', '=', warehouse_id)
        ], limit=1)

        if not picking_type:
            return {'error': 'No se ha encontrado un tipo de operación interna para el almacén seleccionado'}

        picking = request.env['stock.picking'].create({
            'picking_type_id': picking_type.id,
            'location_id': package.location_id.id,
            'location_dest_id': location.id,
        })

        for quant in package.quant_ids:
            request.env['stock.move'].create({
                'name': quant.product_id.name,
                'product_id': quant.product_id.id,
                'product_uom_qty': quant.quantity,
                'product_uom': quant.product_id.uom_id.id,
                'picking_id': picking.id,
                'location_id': package.location_id.id,
                'location_dest_id': location.id,
            })

        picking.action_confirm()
        # picking.action_assign()

        return {'success': True, 'picking_id': picking.id}
    
    @http.route('/disber_barcode/get_warhouses_and_locations', type='json', auth='user')
    def get_warhouses_and_locations(self):
        warehouses = request.env['stock.warehouse'].search([])
        locations = request.env['stock.location'].search([])
        return {
            'warehouses': [{'id': wh.id, 'name': wh.name} for wh in warehouses],
            'locations': [{'id': loc.id, 'name': loc.complete_name} for loc in locations],
        }
    
    @http.route('/disber_barcode/get_pickings', type='json', auth='user')
    def get_pickings(self):
        pickings = request.env['stock.picking'].search([('state', 'in', ['confirmed', 'assigned'])])
        return {
            'pickings': [{
                'id': picking.id,
                'name': picking.name,
                'state': picking.state.title(),
                'location_id': picking.location_id.complete_name,
                'location_dest_id': picking.location_dest_id.complete_name,
                'partner_id': picking.partner_id.display_name if picking.partner_id else 'false',
                'scheduled_date': picking.scheduled_date,
            } for picking in pickings]
        }
    
    @http.route('/disber_barcode/get_picking_info', type='json', auth='user')
    def get_picking_info(self, picking_id):
        picking = request.env['stock.picking'].browse(picking_id)
        return {
            'picking': {
                'id': picking.id,
                'name': picking.name,
                'origin': picking.origin,
                'state': picking.state.title(),
                'scheduled_date': picking.scheduled_date,
                'location_id': picking.location_id.complete_name,
                'location_dest_id': picking.location_dest_id.complete_name,
                'partner_id': picking.partner_id.name,
                'move_ids': [{
                    'id': move.id,
                    'product_id': move.product_id.display_name,
                    'product_uom_qty': move.product_uom_qty,
                    'quantity': move.quantity,
                    'product_uom': move.product_uom.name,
                } for move in picking.move_ids],
            }
        }
    
    @http.route('/disber_barcode/check_package', type='json', auth='user')
    def check_package(self, barcode, picking_id):
        picking = request.env['stock.picking'].browse(picking_id)
        package = request.env['stock.quant.package'].search([('name', '=', barcode)], limit=1)
        if not package:
            return {'error': 'Paquete no encontrado'}
        
        for move in picking.move_ids:
            for quant in package.quant_ids:
                if quant.product_id.id == move.product_id.id:
                    if quant.quantity >= move.product_uom_qty:
                        quantity = move.product_uom_qty
                    else:
                        quantity = quant.quantity
                    return {
                        'move_id': move.id,
                        'package_id': package.id,
                        'location_id': package.location_id.id,
                        'location_dest_id': picking.location_dest_id.id,
                        'product_id': move.product_id.id,
                        'quantity': quantity,
                        'picking_id': picking.id,
                        'quant_id': quant.id,
                    }
        
        return {'error': 'El paquete no contiene productos de la lista de productos del albarán'}
        
    
    def _try_open_package_picking(self, barcode):

        package = request.env['stock.quant.package'].search([('name', '=', barcode)], limit=1)

        if package:

            quants = [{
                'id': quant.id,
                'quantity': quant.quantity,
                'product': quant.product_id.display_name,
            } for quant in package.quant_ids]

            return {
                'action': {
                    'type': 'ir.actions.client',
                    'tag': 'package_without_pickings_menu_action',
                    'context': {
                        'barcode': barcode, 
                        'package': {
                            'id': package.id,
                            'name': package.name,
                            'location': package.location_id.complete_name,
                            'quants': quants
                        }
                    }
                }
            }
        return False
    