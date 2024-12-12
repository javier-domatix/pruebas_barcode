# -*- coding: utf-8 -*-

{
    'name': "Disber Barcode",
    'description': """
Barcode for Disber
    """,
    'category': 'Inventory/Inventory',
    'version': '1.0',
    'depends': ['stock', 'web_tour', 'web'],
    'data': [
        'data/data.xml',
        'views/stock_barcode_views.xml',
        'wizards/stock_move_line_wizard.xml',
        'security/ir.model.access.csv',
    ],
    'installable': True,
    'auto_install': True,
    'application': True,
    'assets': {
        'web.assets_backend': [
            'disber_barcode/static/src/**/*.js',
            'disber_barcode/static/src/**/*.scss',
            'disber_barcode/static/src/**/*.xml',
        ]
    }
}
