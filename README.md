# Investigating Morphogensis for Haystack Labs 2022

I like to call this one "Coral Corral".

![Screen Shot 2022-04-21 at 9 47 40 PM](https://user-images.githubusercontent.com/27078897/164581004-33fdd6f1-54ba-4545-92da-76c65e97cdf4.png)

Kate Reed and I are exploring digital morphogenisis in preperation for Haystack.

The first algorithm that caught my eye is for differential growth. An idea for a potential project emerged as such.

- Implement some sort of differential growth algorithm.
- Modify the "growth environment" or growth parameters with 
  - User input
  - Or using feedback from environmental processes on the island
- Use the growth data to drive a CNC machine.

I especially like the idea of placing networked sensors around the island, plugging them into a growth algorithm which in real time slowly drives a cnc or
3D-printer, and seeing what comes out. It'll be like an interpretive snapshot of the island's environment at that moment in time, 
through the senses of a robot.

I did a few experiments making some 3D(ish) models starting with differential growth algorithm.

Currently it's implemented in 2D generating this

![Screen Recording 2022-04-21 at 9 29 22 PM](https://user-images.githubusercontent.com/27078897/164579749-69df0205-d927-4fb1-8b04-1020151492c6.gif)

Over time this generates a stack of slices (like a CT scan) which is a voxel dataset. Apply marching cubes and you've got a mesh.

I created a quick and dirty ThreeJS app to visualize the slices. It doesn't return a nice mesh (yet). You can see the 3D model below.

![Screen Recording 2022-04-21 at 9 29 22 PM](https://user-images.githubusercontent.com/27078897/164580195-afa33ff9-c867-460a-a8ff-fd3c2d2d1d3f.gif)


# Swarm Interpolation

These prototypes were originally made by Lingdong Huang.
