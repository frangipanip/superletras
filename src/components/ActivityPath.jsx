import { img } from "../lib/assets";
import "./ActivityPath.css";

export const ACTIVITY_PATH_SIGNS = [
	"INICIALESbtn.png",
	"MARIPOSAbtn.png",
	"FLORbtn.png",
	"PELUCHESbtn.png",
	"TRENbtn.png",
	"DIBUJARbtn.png",
	"MEMOTESTbtn.png",
	"BARCOSbtn.png",
	"PASTELbtn.png",
	"PUZZLEbtn.png",
	"DECORAbtn.png",
	"GLOBOSbtn.png"
];

export const WORLD_ACTIVITY_PATHS = {
	mundo3: [
		[36, 78], [30, 82], [34, 76], [38, 72], [42, 77],
		[46, 82], [50, 75], [54, 70], [58, 75], [62, 81],
		[66, 77], [70, 72], [74, 76], [78, 82], [82, 77],
		[86, 72], [90, 76], [94, 82], [98, 78]
	],
	mundo4: [
		[20, 72], [24, 76], [28, 70], [32, 67], [36, 71],
		[40, 76], [44, 72], [48, 68], [52, 72], [56, 77],
		[60, 73], [64, 68], [68, 72], [72, 77], [76, 73],
		[80, 69], [84, 73], [88, 78], [92, 74]
	],
	mundo5: [
		[8, 83], [17, 83], [26, 83], [35, 83], [44, 83],
		[53, 83], [62, 83], [71, 83], [80, 83], [90, 83],
		[12.5, 83], [21.5, 83], [30.5, 83], [39.5, 83], [48.5, 83],
		[57.5, 83], [66.5, 83], [75.5, 83], [85, 83]
	],
	mundo6: [
		[20, 70], [25, 76], [30, 72], [35, 67], [40, 72],
		[45, 77], [50, 73], [55, 68], [60, 72], [65, 77],
		[70, 73], [75, 68], [80, 73], [85, 78], [90, 73],
		[94, 68], [96, 73], [98, 78], [99, 74]
	]
};

export default function ActivityPath({ positions, visibleCount = 0, onActivityClick, buttonClassName = "" }) {
	return (
		<div className="activity-path" aria-label="Camino de actividades">
			{positions.map(([left, top], index) => {
				const visible = index < visibleCount;
				return (
					<div
						className={`activity-path__slot${visible ? "" : " is-hidden"}`}
						key={`${left}-${top}-${index}`}
						style={{ left: `${left}%`, top: `${top}%` }}
					>
						<img
							className="activity-path__sign"
							src={img(ACTIVITY_PATH_SIGNS[index] || "GLOBOSbtn.png")}
							alt=""
							draggable={false}
						/>
						<button
							className={`activity-path__button${buttonClassName ? ` ${buttonClassName}` : ""}`}
							type="button"
							disabled={!visible || !onActivityClick}
							aria-label={`Actividad del camino ${index + 1}${visible ? "" : ", próximamente"}`}
							onClick={visible && onActivityClick ? () => onActivityClick(index) : undefined}
						>
							<img src={img("boton.svg")} alt="" draggable={false} />
						</button>
					</div>
				);
			})}
		</div>
	);
}
