# End-to-End Test Scenarios




### Scenario: Port highlighting in lineage
```gherkin
Given Dataproduct and "WMA Analytics" are expanded
When I select the "Raw Data" input port on Dataproduct
Then the "Raw Data" port shows purple background (selected)
And all source ports in upstream lineage show green background
And all target ports in downstream lineage show green background
And ports not in lineage maintain gray background
```

### Scenario: Pagination preserves lineage highlighting
```gherkin
Given Dataproduct is expanded
And a port on page 1 is selected showing lineage
When I navigate to page 2 of the ports
Then the lineage highlighting is maintained
And ports on page 2 that are in the lineage show green background
And edges update to show connections for visible ports on page 2
And the overall lineage selection remains active
```

### Scenario: Multiple node expansion and collapse workflow
```gherkin
Given all nodes are collapsed
When I expand Dataproduct
Then Dataproduct and its connected nodes expand
When I then expand "WMA Insights" (if it wasn't already expanded)
Then "WMA Insights" and its connected nodes expand
When I collapse Dataproduct
Then only Dataproduct collapses
And other expanded nodes remain expanded
And edges update accordingly
```

### Scenario: Edge visibility based on expansion state
```gherkin
Given Dataproduct is collapsed
And "WMA Analytics" is expanded
When I view the canvas
Then I should see a direct edge from Dataproduct node to "WMA Analytics" node
And I should not see port-to-port edges between these nodes
When I expand "WMA Account"
Then the direct edge disappears
And port-to-port edges appear connecting specific ports
And edges only show for visible ports within the current pagination view
```

### Scenario: Port sorting with lineage ports first
```gherkin
Given Dataproduct is expanded
And a port with lineage relationships is on page 2
When lineage becomes active
Then ports are re-sorted to show lineage ports first
And lineage ports appear at the top of the list
And pagination adjusts to show lineage ports on earlier pages
```

### Scenario: ReactFlow controls interaction
```gherkin
Given the application is loaded
When I use the zoom controls
Then I can zoom in and out of the canvas
When I use the fit view control
Then the canvas adjusts to fit all nodes in view
When I use the minimap
Then I can see an overview of the entire canvas
And I can click the minimap to navigate to different areas
```

### Scenario: Canvas panning and navigation
```gherkin
Given the application is loaded
When I click and drag on the canvas background
Then the canvas pans in the direction of the drag
When I use the mouse wheel
Then the canvas zooms in or out
When I expand a node
Then the viewport smoothly animates to center on the expanded nodes
```

## Feature: Error Handling

### Scenario: API error during data load
```gherkin
Given the mock API returns an error
When I navigate to the application
Then I should see a loading indicator initially
And after the API call fails
Then I should see an error message
And the canvas should remain empty
```

### Scenario: Handle temporary React Flow errors during pagination
```gherkin
Given a node is expanded with paginated ports
When I quickly navigate between pages
Then temporary React Flow handle errors may occur in console
But the application continues to function correctly
And edges update properly after handles are registered
And no user-visible errors are displayed
```

## Feature: Visual Design and Styling

### Scenario: Node visual states
```gherkin
Given the application is loaded
When I view a collapsed node
Then it should have a white background
And a subtle shadow
And rounded corners
When I expand a node
Then it should grow to accommodate the ports
And maintain the white background
And show clear sections for input and output ports
```

### Scenario: Port visual states
```gherkin
Given a node is expanded
When I view an unselected port
Then it should have a gray background
When I hover over a port
Then the cursor should indicate it's clickable
When I select a port
Then it should have a purple background
When a port is in active lineage
Then it should have a green background
```

### Scenario: Edge visual states
```gherkin
Given nodes are connected
When no lineage is active
Then edges should have default gray color
And standard stroke width (2px)
When lineage is active
Then lineage edges should be blue
And have increased stroke width (3px)
And non-lineage edges should have reduced opacity (0.2)
```

## Feature: Data Display

### Scenario: Display correct data product information
```gherkin
Given the application loads successfully
Then I should see Dataproduct data product with 8 inputs and 8 outputs
And I should see "WMA Analytics" data product with 6 inputs and 7 outputs
And I should see "WMA Insights" data product with 6 inputs and 5 outputs
And I should see 3 direct relationships between the nodes when collapsed
And I should see 10 port-to-port relationships when nodes are expanded
```

### Scenario: Port pagination counts
```gherkin
Given Dataproduct node is expanded
And it has 8 input ports
When I view the Input Ports section
Then the first page shows ports 1-5
And the page indicator shows "Page 1 of 2"
When I navigate to page 2
Then the second page shows ports 6-8
And the page indicator shows "Page 2 of 2"
```
