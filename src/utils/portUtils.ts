import type { Port } from "../types";

/**
 * Sorts ports with lineage ports appearing first, while keeping the selected port in its original position.
 *
 * @param ports - Array of ports to sort
 * @param lineagePorts - Set of port IDs that are in the lineage
 * @param selectedPortId - ID of the currently selected port (stays in original position)
 * @returns Sorted array of ports
 */
export const sortPortsWithLineage = (
  ports: Port[],
  lineagePorts: Set<string> | undefined,
  selectedPortId: string | null | undefined
): Port[] => {
  // Find the original index of the selected port
  const selectedIndex = ports.findIndex(port => port.id === selectedPortId);

  // Helper function to check if port is in lineage
  const isInLineage = (portId: string) => lineagePorts && lineagePorts.has(portId);

  // If no port is selected, just sort normally
  if (selectedIndex === -1) {
    return [...ports].sort((firstPort, secondPort) => {
      const firstPortInLineage = isInLineage(firstPort.id);
      const secondPortInLineage = isInLineage(secondPort.id);
      if (firstPortInLineage && !secondPortInLineage) return -1;
      if (!firstPortInLineage && secondPortInLineage) return 1;
      return 0;
    });
  }

  // Separate selected port from other ports
  const selectedPort = ports[selectedIndex];
  const otherPorts = ports.filter(port => port.id !== selectedPortId);

  // Sort other ports (lineage to top)
  const sortedOtherPorts = otherPorts.sort((firstPort, secondPort) => {
    const firstPortInLineage = isInLineage(firstPort.id);
    const secondPortInLineage = isInLineage(secondPort.id);
    if (firstPortInLineage && !secondPortInLineage) return -1;
    if (!firstPortInLineage && secondPortInLineage) return 1;
    return 0;
  });

  // Insert selected port back at its original index
  const result = [...sortedOtherPorts];
  result.splice(selectedIndex, 0, selectedPort);

  return result;
};
