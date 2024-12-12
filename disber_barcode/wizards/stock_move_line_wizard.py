from odoo import models, fields, api

class StockMoveLineWizard(models.TransientModel):
    _name = 'stock.move.line.wizard'
    _description = 'Wizard to update stock move line'

    move_id = fields.Many2one('stock.move', string='Stock Move Line')
    quantity = fields.Float(string='Cantidad')
    location_id = fields.Many2one('stock.location', string='Ubicación')
    location_dest_id = fields.Many2one('stock.location', string='Ubicación destino')
    package_id = fields.Many2one('stock.quant.package', string='Paquete')
    result_package_id = fields.Many2one('stock.quant.package', string='Paquete destino')
    lot_id = fields.Many2one('stock.lot', string='Lote')
    product_id = fields.Many2one('product.product', string='Producto')
    picking_id = fields.Many2one('stock.picking', string='Albarán')
    quant_id = fields.Many2one('stock.quant', string='Stock')

    def update_move_line(self):
        self.env['stock.move.line'].create({
            'quant_id' : self.quant_id.id,
            'move_id' : self.move_id.id,
        })

        return {
            'type': 'ir.actions.client',
            'tag': 'reload',
        }

