# Мост

Книга-игра Роберта Фадера на русском языке (18+). Героиня — ты: Наталья на первом свидании с Робертом в Москве, где каждый мост открывает другую эпоху. 24 эпизода с выбором и 22 финала: 7 трагических, 7 нейтральных, 7 счастливых и 1 свадебный.

## Estructura

- `index.html`: el sitio completo (no necesita compilación). Aviso 18+, portada con el panel de finales, lector con temas y tamaño de letra.
- `book.json`: título, descripción y lista de episodios. Los finales llevan `"ending": "tragic" | "neutral" | "happy" | "wedding"`.
- `episodes/NN.md`: un archivo por episodio. Párrafos separados por una línea en blanco, `*cursiva*`, `**negrita**`, `***` para un cambio de escena. Las decisiones van al final en un bloque:

```
::: choices Что ты выберешь?
[Primera opción](02.md)
[Segunda opción](03.md)
```

Los finales descubiertos y el último episodio se guardan en el navegador (`localStorage`, prefijo `most:`).

## Publicación

GitHub Pages: Settings → Pages → «Deploy from a branch», rama `main`, carpeta `/ (root)`.
