from odoo import models, fields, api


class ResUsers(models.Model):
    _inherit = 'res.users'

    disable_popups_notifications = fields.Boolean(
        string='Disable Popup Notifications',
        help='If checked, message popups will not be displayed for this user.',
    )
