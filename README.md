# Мост

Книга-игра Роберта Фадера на русском языке (18+). Героиня — ты: Наталья на первом свидании с Робертом в Москве, где каждый мост открывает другую эпоху. 24 эпизода с выбором и 22 финала: 7 трагических, 7 нейтральных, 7 счастливых и 1 свадебный.

## Estructura

- `index.html`: el sitio completo (no necesita compilación). Aviso 18+, portada con el panel de finales, lector con temas y tamaño de letra.
- `book.json`: título, descripción y lista de episodios. Los finales llevan `"ending": "tragic" | "neutral" | "happy" | "wedding"`.
- `episodes/NN.enc`: un archivo por episodio, **cifrado** (ver «Contraseña»). El texto, una vez descifrado, es Markdown: Párrafos separados por una línea en blanco, `*cursiva*`, `**negrita**`, `***` para un cambio de escena. Las decisiones van al final en un bloque:

```
::: choices Что ты выберешь?
[Primera opción](02.md)
[Segunda opción](03.md)
```

Los finales descubiertos, el último episodio y la clave se guardan en el navegador (`localStorage`, prefijo `most:`), así que en el mismo dispositivo la contraseña se pide una sola vez.

## Contraseña

Para entrar hay que confirmar la edad y escribir la contraseña. La contraseña **no** está en el repositorio: los episodios están cifrados con AES-GCM y una clave derivada de la contraseña (PBKDF2-SHA256; la sal, las iteraciones y un texto de control están en `lock` dentro de `book.json`). Sin la contraseña no se pueden leer ni descargando los archivos.

Para editar un episodio (hace falta Node 20 o más nuevo):

```
node tools/decrypt.mjs . <contraseña>     # crea episodes/NN.md
# editar los .md
node tools/encrypt.mjs . <contraseña>     # vuelve a cifrar y borra los .md
```

Los `.md` están en `.gitignore`: no subirlos nunca. Para cambiar la contraseña, descifrar con la antigua y cifrar con la nueva. El descifrado en el navegador necesita HTTPS (GitHub Pages lo usa).

## Publicación

GitHub Pages: Settings → Pages → «Deploy from a branch», rama `main`, carpeta `/ (root)`.
