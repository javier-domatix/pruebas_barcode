{
    'name': 'Popup Window Chat',
    'summary': 'Stop popup window tabs for chat notificactions',
    'version': '17.0.1.0.0',
    'license': 'AGPL-3',
    'author': 'Domatix',
    'depends': [
        'mail',
    ],
    'data': [
        'views/res_user.xml'
    ],
    'assets': {
        'web.assets_backend': [
            'popup_window_chat/static/src/components/chat_window_model.js',
        ],
    },
    'application': False,
    'installable': True,
}