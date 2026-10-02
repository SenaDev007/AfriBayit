#!/usr/bin/env python3
"""
Génère src/components/ui/flag-art.ts — drapeaux SVG inline (plus aucune requête réseau).

- Parse chaque public/flags/<iso>.svg (flagcdn, domaine public)
- Préfixe les IDs internes par "<iso>-" pour éviter les collisions quand
  plusieurs drapeaux inline cohabitent dans le même document (<use href="#...">)
- Convertit les attributs SVG kebab-case en camelCase React
- Convertit les attributs style="..." en objets { prop: valeur }
- Émet des appels React.createElement imbriqués (module .ts, pas .tsx)
"""
import xml.etree.ElementTree as ET
import json
import re
import sys
import os

FLAGS_DIR = "/home/z/repos/AfriBayit/public/flags"
OUT_FILE = "/home/z/repos/AfriBayit/src/components/ui/flag-art.ts"

CAMEL_ATTRS = {
    "stroke-width": "strokeWidth",
    "stroke-linecap": "strokeLinecap",
    "stroke-linejoin": "strokeLinejoin",
    "stroke-miterlimit": "strokeMiterlimit",
    "stroke-dasharray": "strokeDasharray",
    "stroke-dashoffset": "strokeDashoffset",
    "clip-path": "clipPath",
    "fill-rule": "fillRule",
    "clip-rule": "clipRule",
    "fill-opacity": "fillOpacity",
    "stroke-opacity": "strokeOpacity",
    "xlink:href": "href",
}
XLINK_HREF = "{http://www.w3.org/1999/xlink}href"
SKIP_ROOT_ATTRS = {"xmlns", "version", "width", "height", "viewBox", "xmlns:xlink"}


def camel_css(prop: str) -> str:
    return re.sub(r"-(\w)", lambda m: m.group(1).upper(), prop.strip())


def js_str(v: str) -> str:
    return json.dumps(v, ensure_ascii=False)


def parse_style(v: str) -> str:
    props = []
    for part in v.split(";"):
        if ":" in part:
            k, val = part.split(":", 1)
            props.append(f"{camel_css(k)}: {js_str(val.strip())}")
    return "{" + ", ".join(props) + "}"


def rewrite_url_refs(v: str, idmap) -> str:
    return re.sub(r"url\(#([^)]+)\)", lambda m: "url(#" + idmap.get(m.group(1), m.group(1)) + ")", v)


def attr_js(k: str, v: str, idmap) -> tuple:
    """Retourne (clé_js, valeur_js) ou None si attribut à ignorer."""
    if k == XLINK_HREF or k == "href":
        if v.startswith("#") and v[1:] in idmap:
            v = "#" + idmap[v[1:]]
        return ("href", js_str(v))
    if k == "id":
        return ("id", js_str(idmap.get(v, v)))
    if k == "style":
        return ("style", parse_style(v))
    if k in SKIP_ROOT_ATTRS and SKIP_ROOT_ATTRS is not None and k in ("viewBox",):
        return None
    key = CAMEL_ATTRS.get(k, k)
    if key in ("viewBox",):
        return None
    if "url(#" in v:
        v = rewrite_url_refs(v, idmap)
    return (key, js_str(v))


def collect_ids(root) -> dict:
    idmap = {}
    for e in root.iter():
        eid = e.attrib.get("id")
        if eid:
            idmap[eid] = eid  # placeholder, rempli par le préfixe plus bas
    return idmap


def emit_element(e, idmap, indent=0) -> str:
    """Émet ce('tag', {attrs}, ...enfants) en une expression JS."""
    pad = "  " * indent
    tag = e.tag.split("}")[-1]
    attrs = []
    for k, v in e.attrib.items():
        if e is not None and tag == "svg":
            continue  # attributs racine gérés séparément
        conv = attr_js(k, v, idmap)
        if conv:
            attrs.append(f"{conv[0]}: {conv[1]}")
    attr_src = "{" + ", ".join(attrs) + "}"
    children = [emit_element(c, idmap, indent + 1) for c in e]
    if children:
        inner = (",\n" + "  " * (indent + 1)).join(children)
        return f"ce({js_str(tag)}, {attr_src},\n{'  ' * (indent + 1)}{inner})"
    return f"ce({js_str(tag)}, {attr_src})"


def convert(iso: str, path: str) -> str:
    tree = ET.parse(path)
    root = tree.getroot()

    # viewBox : explicite ou reconstruit depuis width/height
    vb = root.attrib.get("viewBox")
    if not vb:
        w = root.attrib.get("width", "900")
        h = root.attrib.get("height", "600")
        vb = f"0 0 {w} {h}"

    # préfixer tous les ids par "<iso>-"
    idmap = collect_ids(root)
    idmap = {old: f"{iso}-{old}" for old in idmap}

    # enfants de la racine (la racine svg est rendue par CountryFlag)
    parts = []
    for child in root:
        parts.append(emit_element(child, idmap, 1))
    if not parts:
        children_src = "null"
    elif len(parts) == 1:
        children_src = parts[0]
    else:
        # Plusieurs enfants racine → Fragment (évite les warnings React sur les arrays)
        inner = (",\n  ").join(parts)
        children_src = f"ce(Fragment, null,\n  {inner})"

    return (
        f"export const FLAG_ART_{iso.upper()}: FlagArt = {{\n"
        f"  viewBox: {js_str(vb)},\n"
        f"  nodes: {children_src or 'null'},\n"
        f"}};\n"
    )


def main():
    files = sorted(
        f for f in os.listdir(FLAGS_DIR)
        if f.endswith(".svg") and re.match(r"^[a-z]{2}\.svg$", f)
    )
    blocks = []
    for f in files:
        iso = f[:2]
        blocks.append(convert(iso, os.path.join(FLAGS_DIR, f)))

    header = (
        "/**\n"
        " * FlagArt — drapeaux nationaux SVG INLINE (généré, ne pas éditer à la main).\n"
        " * Source : public/flags/*.svg (flagcdn.com — domaine public), convertis en\n"
        " * React.createElement par scripts de génération.\n"
        " *\n"
        " * Pourquoi inline ? Les <img src=\"/flags/x.svg\"> dépendaient du réseau,\n"
        " * du cache HTTP et du service worker. Le rendu inline garantit l'affichage\n"
        " * du drapeau sur TOUT navigateur (Windows desktop inclus) sans aucune\n"
        " * requête réseau — plus d'image cassée possible.\n"
        " *\n"
        " * IDs internes préfixés par \"<iso>-\" pour éviter les collisions quand\n"
        " * plusieurs drapeaux cohabitent dans le même document (<use href>).\n"
        " */\n"
        "import React from 'react';\n\n"
        "const ce = React.createElement;\n"
        "const Fragment = React.Fragment;\n\n"
        "export interface FlagArt {\n"
        "  viewBox: string;\n"
        "  nodes: React.ReactNode;\n"
        "}\n\n"
    )

    index = "\nexport const FLAG_ARTS: Record<string, FlagArt> = {\n"
    for f in files:
        iso = f[:2].upper()
        index += f"  {iso}: FLAG_ART_{iso},\n"
    index += "};\n"

    with open(OUT_FILE, "w", encoding="utf-8") as fh:
        fh.write(header + "\n\n".join(blocks) + "\n" + index)

    total = os.path.getsize(OUT_FILE)
    print(f"OK — {len(files)} drapeaux générés dans {OUT_FILE} ({total} octets)")
    for f in files:
        print(f"  {f}")


if __name__ == "__main__":
    main()
