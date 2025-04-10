from odoo import models


class Http(models.AbstractModel):
    _inherit = 'ir.http'

    def session_info(self):
        user = self.env.user
        session_info = super(Http, self).session_info()
        session_info['user_context']['disable_popups_notifications'] = user.disable_popups_notifications
        return session_info
