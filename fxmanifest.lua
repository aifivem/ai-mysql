name 'ai-mysql'
author 'ai-core'
version '2.14.3'
license 'GPL-3.0-only'
description 'Database engine and oxmysql stand-in: provides oxmysql, mysql-async and ghmattimysql'
repository 'https://github.com/TGIANN/ai-mysql'
fx_version 'cerulean'
game 'gta5'
node_version '22'

server_script 'dist/server.js'


dependencies {
	'/server:12913',
}

files {
	'locales/*.json',
}
provide 'oxmysql'
provide 'mysql-async'
provide 'ghmattimysql'
