import { useGameStore } from "../store/useGameStore";

export default function AbilityWindow() {
    const abilities = useGameStore(state => state.abilities)
    console.log(abilities)

    return (
        <div>{abilities.length}
            {abilities.map((ability) => (
                <label key={ability.id}>
                    {ability.id} - {ability.name} - {ability.description} - x{ability.usages}
                </label>
            ))}
        </div>
    )
}