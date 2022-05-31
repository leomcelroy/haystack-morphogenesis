# Haystack Labs 2022: Design Tools

Over the course of Haystack Labs Lingdong and I made a series of design tools.
We originally set out to make some tools which would allow artists to design natural shapes, and did make a few,
but we also took a detour into making some tools for Pensa's in-development wire bending machine.

# Swarm Interpolation

You can play with the tool [here](https://leomcelroy.com/haystack-morphogenesis/swarm-interpolation-v3/).

Our first tool grew out of a series of conversations with Kate Reed. 
It allows the designer to specify cross-sections of a shape. 
These cross sections are then connected by a swarm of particles which perserve certain features between intermediate cross-sections (like the number of islands).

You can see the tool running below:

![Screen Recording 2022-05-24 at 4 14 36 PM](https://user-images.githubusercontent.com/27078897/171188742-ba085979-3fff-41fa-a337-834ff3a2716d.gif)

We used the Potterbot which Phirack brought to print an "A" which morphs into a "B".

![PXL_20220528_135459130](https://user-images.githubusercontent.com/27078897/171188923-a89a26ea-1313-4e41-978e-41676bba8720.jpg)

![PXL_20220528_135506401](https://user-images.githubusercontent.com/27078897/171188936-8ee190ba-170c-4bd1-8ccf-d5e1cb09703a.jpg)

# Draw-n-Grow (Coral Corral)

You can play with the tool [here](https://leomcelroy.com/haystack-morphogenesis/draw-n-grow/).

Draw and Grow lets you sketch lines which you can evolve with a differential growth algorithm. 
The evolution of the shape forms a 3D object which you can export to Potterbot gcode. 
You can adjust the growth parameters of the algorithm as it runs.

You can see the tool running below:

![pasted image 0](https://user-images.githubusercontent.com/27078897/171190173-5ba9489d-b1ac-49d1-b2b4-61b046f353d4.gif)

We used the tool to produce this pot:

<img width="577" alt="Screen Shot 2022-05-27 at 10 12 19 AM" src="https://user-images.githubusercontent.com/27078897/171190302-5bd6d677-1f68-4167-b916-b24bba73eabd.png">

# Wire Logo

You can play with the tool [here](https://leomcelroy.com/haystack-morphogenesis/wire-logo/).

Wire Logo is a custom programming language inspired by Logo to design wire bending patterns using a "pen" that you can navigate in 3D space.

The language supports the commands used in the example below, arguments to these commands are parsed as JavaScript.

```
forward 10
left 20 * 4
forward 30
setHeading 10, 20
if 1 == 2 then 
  forward 40 
  forward 2
else 
  goTo 50, 60, 70
end
make a 3
forward a + 3
for 10 as i do
  forward i
  left 20
  if 1 <= 3 then 
    left 5
  end
end
```

You can see a design for a 3D sin wave here:

<img width="927" alt="Screen Shot 2022-05-26 at 3 32 33 PM" src="https://user-images.githubusercontent.com/27078897/171190878-f15525db-54aa-4c0f-aff3-90843e9e43ae.png">

Which when bent produced this object:

![IMG_8842](https://user-images.githubusercontent.com/27078897/171191093-df3efb49-2847-4d6f-87b4-e34e85a012f3.jpg)

# Wire Slicer

You can play with the tool [here](https://leomcelroy.com/haystack-morphogenesis/mesh-wire/).

# Some Background

The projects above grew out of investigating morphogenesis design tools for Haystack Labs 2022 with Kate Reed, Lingdong Huang, and myself.
Some of the earlier investigations can be found [here]().
