/*
The restriction system is designed to be extensible.

Adding a new parameter type requires:
1. Defining a restriction type in param_restrictions that matches the IRestriction interface
2. Adding a RestrictionTraits specialization so FilterParameter can resolve the matching restriction type
*/


// ! This implementation goes into the hpp/tpp files.