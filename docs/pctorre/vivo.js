// Capas animadas del modo «Funciona» del PC de torre. Cada capa es un THREE.Group en coordenadas de mundo;
// userData.tick(anim) la anima (anim.t avanza con el tiempo). Los caminos pasan por el centro (pos) de piezas del contrato.
// Nombres: ac, vsb, senal, dc12, dc5, vrm, spi, ddr, pcie, dmi, vram, calor, aire, led_cpu, led_dram, led_vga, led_boot.
import * as THREE from 'three';
import { flujo, rotulo, mb } from '../vivo.js';

const COL = { ac: 0xff8a3d, vsb: 0xb36bff, senal: 0x3ddc84, pwrok: 0xdddddd, dc12: 0xffc83d, dc5: 0xff5050, vrm: 0xffe9a8, spi: 0x4aa3df, ddr: 0x2ec4b6,
  pcie: 0xc77dff, dmi: 0x8aa0ff, vram: 0xff7ac6, calor: 0xff4d4d, aire: 0x6fd3ff, led: 0xff9d2e };

export function capas(ctx) {
  const { pos, L } = ctx, P = (...ids) => ids.map(i => (typeof i === 'string' ? pos(i) : i).clone());
  const ro = (o, n) => { o.renderOrder = n; return o; };
  const juntar = (...objs) => { const g = new THREE.Group(); g.add(...objs); const f = []; g.traverse(o => o !== g && o.userData.tick && f.push(o.userData.tick)); g.userData.tick = c => f.forEach(t => t(c)); return g; };
  const fl = (ids, color, o = {}) => flujo(P(...ids), { color, r: 0.12, tam: 0.3, n: 10, vel: 0.1, ...o });
  const lbl = (t, p, o = {}) => rotulo(t, (typeof p === 'string' ? pos(p) : p).clone().add(new THREE.Vector3(0, 2.2, 1.5)), { esc: 2.2, ancho: Math.max(1.6, t.length * 0.36), ...o });
  // halo que late sobre una pieza (nodo activo)
  const halo = (id, color, r = 1.2, f = 3) => {
    const m = ro(new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mb(color, { opacity: 0.35 })), 7); m.position.copy(pos(id));
    m.userData.tick = ({ t }) => { const s = 0.8 + 0.3 * Math.sin(t * f); m.scale.setScalar(s); m.material.opacity = 0.2 + 0.2 * Math.sin(t * f); };
    return m;
  };
  const C = {};
  C.ac = juntar(fl(['cable_ac', 'psu_entrada_iec', 'psu_fusible', 'psu_emi_bobinas', 'psu_puente', 'psu_pfc_bobina', 'psu_bulk', 'psu_llc_mosfets', 'psu_transformador'], COL.ac),
    fl(['psu_puente', 'psu_5vsb_trafo'], COL.ac, { n: 5 }), halo('psu_bulk', COL.ac), lbl('~400 V', 'psu_bulk'));
  C.vsb = juntar(fl(['psu_5vsb_trafo', 'psu_conectores_modulares', 'cable_atx24', 'mb_atx24', 'mb_superio'], COL.vsb, { n: 8 }), fl(['mb_atx24', 'mb_pch'], COL.vsb, { n: 5 }),
    halo('psu_5vsb_trafo', COL.vsb), lbl('5VSB', 'psu_5vsb_trafo'));
  C.senal = juntar(fl(['caja_boton_power', 'cable_panel_frontal', 'mb_hdr_fpanel', 'mb_superio', 'mb_pch'], COL.senal, { n: 6 }),
    fl(['mb_pch', 'mb_atx24', 'cable_atx24', 'psu_conectores_modulares', 'psu_supervisor'], COL.senal, { n: 6 }),
    fl(['psu_supervisor', 'psu_conectores_modulares', 'cable_atx24', 'mb_atx24', 'mb_pch'], COL.pwrok, { n: 5, vel: 0.07 }),
    halo('caja_boton_power', COL.senal, 1, 4), lbl('PS_ON#', 'caja_boton_power'), lbl('PWR_OK', 'psu_supervisor'));
  C.dc12 = juntar(fl(['psu_transformador', 'psu_rect_sinc', 'psu_cond_salida', 'psu_conectores_modulares', 'cable_eps1', 'mb_eps1', 'mb_vrm_controlador'], COL.dc12),
    fl(['psu_conectores_modulares', 'cable_eps2', 'mb_eps2'], COL.dc12, { n: 6 }), fl(['psu_conectores_modulares', 'cable_12v2x6', 'gpu_conector_12v'], COL.dc12, { n: 8 }),
    lbl('12 V', 'psu_cond_salida'));
  C.dc5 = juntar(fl(['psu_dcdc', 'psu_conectores_modulares', 'cable_atx24', 'mb_atx24'], COL.dc5, { n: 8 }),
    fl(['psu_conectores_modulares', 'cable_sata_poder', 'hdd_conectores'], COL.dc5, { n: 6 }), lbl('5 V y 3,3 V', 'psu_dcdc'));
  C.vrm = juntar(fl(['mb_eps1', 'mb_vrm_etapas_sup', 'mb_vrm_bobinas_sup', 'mb_socket'], COL.vrm, { n: 8, vel: 0.14 }),
    fl(['mb_eps1', 'mb_vrm_etapas_izq', 'mb_vrm_bobinas_izq', 'mb_socket'], COL.vrm, { n: 8, vel: 0.14 }), halo('mb_vrm_detalle', COL.dc12, 0.8, 8), lbl('12 V a ~1 V', 'mb_vrm_etapas_sup'));
  C.spi = juntar(fl(['mb_bios', 'mb_pch'], COL.spi, { n: 6 }), fl(['mb_pch', 'cpu_die'], COL.spi, { n: 6, sentido: -1 }), halo('mb_bios', COL.spi), lbl('SPI', 'mb_bios'));
  C.ddr = juntar(fl(['cpu_die_imc', 'mb_dimm_a2', 'ram_a2_chips'], COL.ddr, { n: 10, vel: 0.2 }), fl(['cpu_die_imc', 'mb_dimm_b2', 'ram_b2_chips'], COL.ddr, { n: 10, vel: 0.2 }),
    fl(['mb_pch', 'ram_a2_spd'], COL.spi, { n: 4 }), lbl('DDR5 x2', 'mb_dimm_a2'));
  C.pcie = juntar(fl(['cpu_die_pcie', 'mb_pcie1', 'gpu_contactos', 'gpu_die'], COL.pcie, { n: 12, vel: 0.2 }), fl(['cpu_die_pcie', 'mb_m2_1', 'nvme_controlador'], COL.pcie, { n: 8, vel: 0.2 }),
    lbl('x16', 'mb_pcie1'), lbl('x4', 'mb_m2_1'));
  const led = ro(new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), mb(0xff9d2e)), 9); led.position.copy(pos('caja_leds'));
  led.userData.tick = ({ t }) => { led.visible = Math.sin(t * 11) + Math.sin(t * 7.3) > 0; };
  C.dmi = juntar(fl(['cpu_die_pcie', 'mb_pch'], COL.dmi, { n: 10, vel: 0.18 }), fl(['mb_pch', 'mb_sata', 'cable_sata_datos', 'ssd_conector'], COL.dmi, { n: 6 }),
    fl(['mb_pch', 'mb_lan', 'mb_io_rj45'], COL.dmi, { n: 5 }), fl(['mb_pch', 'mb_io_usb'], COL.dmi, { n: 4 }), led, lbl('DMI 4.0 x8', 'mb_pch'));
  C.vram = juntar(fl(['gpu_die_mem', 'gpu_vram'], COL.vram, { n: 12, vel: 0.22 }), fl(['gpu_vrm_etapas', 'gpu_die_gpcs'], COL.dc12, { n: 6 }),
    halo('gpu_die_gpcs', COL.vram, 1.4, 5), lbl('GDDR6X 192 bits', 'gpu_vram'));
  C.calor = juntar(fl(['cpu_die', 'cpu_stim', 'cpu_ihs', 'cpu_pasta', 'cooler_base', 'cooler_heatpipes', 'cooler_aletas'], COL.calor, { n: 8, vel: 0.08 }),
    fl(['gpu_die', 'gpu_camara_vapor', 'gpu_heatpipes', 'gpu_aletas'], COL.calor, { n: 8, vel: 0.08 }), fl(['mb_vrm_etapas_sup', 'mb_vrm_disipador_sup'], COL.calor, { n: 4 }),
    halo('cpu_die', COL.calor, 1, 2.5));
  C.aire = juntar(fl([L.vent_f3, 'cooler_aletas', L.vent_t], COL.aire, { n: 8, cono: true, tam: 0.5, r: 0.1, vel: 0.12 }), fl([L.vent_f2, 'gpu_vent_1', 'gpu_aletas', L.vent_t], COL.aire, { n: 8, cono: true, tam: 0.5, r: 0.1, vel: 0.12 }),
    fl([L.vent_f1, 'caja_jaula_hdd', 'gpu_vent_2'], COL.aire, { n: 6, cono: true, tam: 0.5, r: 0.1, vel: 0.1 }), fl(['caja_filtro_inferior', 'psu_ventilador', L.psu_iec], COL.aire, { n: 6, cono: true, tam: 0.5, r: 0.1, vel: 0.1 }));
  // LED de diagnóstico: 4 puntos en fila junto a mb_debug_leds; parpadea el de la fase actual, los demás quedan apagados
  const ledFase = (k, extra) => {
    const g = new THREE.Group(), c = pos('mb_debug_leds'), pts = [];
    for (let i = 0; i < 4; i++) {
      const m = ro(new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), mb(i === k ? COL.led : 0x555555, { opacity: i === k ? 1 : 0.5 })), 9);
      m.position.set(c.x, c.y - 0.9 * (i - 1.5), c.z + 0.5); g.add(m); pts.push(m);
    }
    g.add(lbl(['CPU', 'DRAM', 'VGA', 'BOOT'][k], c));
    g.userData.tick = ({ t }) => { pts[k].visible = k === 3 ? true : Math.sin(t * 8) > -0.3; };
    if (extra) g.add(extra);
    return g;
  };
  C.led_cpu = ledFase(0);
  C.led_dram = ledFase(1);
  C.led_vga = ledFase(2);
  const pw = ro(new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), mb(COL.senal)), 9); pw.position.copy(pos('caja_leds'));
  C.led_boot = ledFase(3, pw);
  return C;
}
