export const ROOM_GRID_SIZE = { rows: 10, cols: 10 };

export const ROOM_ASSETS = {
  floor: "/assets/floor.png",
  wall: "/assets/wall.png",
};

export const roomObjects = [
  {
    id: "pc_desk",
    name: "UFOware Desktop",
    sprite: "/assets/desk.png", // <--- Ajustado de desk_0.png para desk.png
    gridPosition: { x: 4, y: 3 },
    walkable: false,
    actionType: "MODAL",
    menuOptions: [
      { id: "cybersec", title: "Segurança da Informação", desc: "Pentest, Análise de Vulnerabilidades e Segurança em Redes." },
      { id: "fullstack", title: "Desenvolvimento Full Stack", desc: "Aplicações em Python (FastAPI), React e Docker." },
      { id: "networks", title: "Redes & Infraestrutura", desc: "Simulações no Cisco Packet Tracer e Topologias." }
    ]
  },
  {
    id: "chair_dev",
    name: "Cadeira Dev",
    sprite: "/assets/chair.png", // <--- Bate com o seu chair.png
    gridPosition: { x: 4, y: 4 },
    walkable: true,
    actionType: "SIT"
  },
  {
    id: "fan_decor",
    name: "Ventoinha",
    sprite: "/assets/fan.png", // <--- Aproveitando seu fan.png
    gridPosition: { x: 1, y: 1 },
    walkable: false
  }
];